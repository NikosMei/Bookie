/*
  Handles to retrive the recommended books we give to the user based on the books he is reading
*/
fetch("http://localhost:8080/recommend", request)
  .then((response) => {
    response.json().then((res) => {
      console.log(res);

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

      document.getElementById("book-recommend").innerHTML +=
        elements.contactDetails(res.quantity);
    });
  })
  .catch((error) => console.log("Error: ", error));
