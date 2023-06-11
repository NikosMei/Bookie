let url = new URLSearchParams(document.location.search);
let search = url.get("query");
const request = {
  method: "POST",
  headers: new Headers({ "content-type": "application/json" }),
  body: JSON.stringify({ search: search }),
};

/*
  Handle the search function by sending a request to the server and receiving the answer based on the full-text query the user gave
*/
fetch("http://localhost:8080/searchresult", request)
  .then((response) => {
    response.json().then((res) => {
      let elements = {};

      elements.contactDetails = Handlebars.compile(
        `{{#each this}}
          <div class="book">
          <a href="http://localhost:8080/read?catId={{_id}}" class="link-prod">
              <div class="book-image">
                <img src="http://localhost:8080/picture?query={{_id}}" alt="{{title}} Cover">
                <div class="summary-popup">{{_source.summary}}</div>
              </div>
              <h2 class="book-title">{{_source.title}}</h2>
              <p><strong>Author:</strong> {{_source.author}}</p>
              <p class = "categories"><strong>Categories:</strong> {{#each _source.category}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}</p>
              <p><strong>Size:</strong> {{_source.size}} pages</p>
            </div>
          </a>
          {{/each}}`
      );

      document.getElementById("book-list").innerHTML += elements.contactDetails(
        res.quantity
      );
    });
  })
  .catch((error) => console.log("Error: ", error));
