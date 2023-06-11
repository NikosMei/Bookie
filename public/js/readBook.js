// Comments
var commentsArray = [];

let url = new URLSearchParams(document.location.search);
let book = url.get("catId");
const request = {
  method: "POST",
  headers: new Headers({ "content-type": "application/json" }),
  body: JSON.stringify({ book: book }),
};
/*
  Retrieves the pdf file of the book
*/
fetch("http://localhost:8080/readbook", request)
  .then((response) => response.blob())
  .then((data) => {
    const blob = new Blob([data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    let elements = {};

    elements.contactDetails = Handlebars.compile(
      `
        <embed id="pdf-embed" src="` +
        url +
        `"width="800px" height="880px" type="application/pdf">
        `
    );

    document.getElementById("pdf-container").innerHTML +=
      elements.contactDetails();
  })
  .then(() => {
    let pdf = document.getElementById("pdf-embed");
  });

/*
  Retrives the audio book(if it exists)
*/
fetch("http://localhost:8080/readaudiobook", request)
  .then((response) => response.blob())
  .then((data) => {
    const blob = new Blob([data], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);

    let elements = {};

    elements.contactDetails = Handlebars.compile(
      `
      <audio controls>
      <source src="` +
        url +
        `" type="audio/mpeg">
    </audio> `
    );

    document.getElementById("audiobook-container").innerHTML +=
      elements.contactDetails();
  })
  .then(() => {
    let pdf = document.getElementById("pdf-embed");
  });
/*
  Retrives the reviews-comments of the book
*/
fetch("http://localhost:8080/readreviews", request).then((response) => {
  response.json().then((res) => {
    commentsArray = res.reviews;
    updateComments();
  });
});

/*
  Responsible for the submition of a comment
*/
document
  .getElementById("comment-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    var commentInput = document.getElementById("comment");

    var comment = commentInput.value;

    if (comment.length > 250) {
      alert("Comment must be 250 characters or less.");
      return;
    }
    //Responsible for saving the submited comment
    fetch("http://localhost:8080/savereviews", {
      method: "POST",
      headers: new Headers({ "content-type": "application/json" }),
      body: JSON.stringify({ comment: comment, book: book }),
    }).then((response) => {
      location.reload();
    });
  });

  /*
    Updates the commentsArray and displays the submited comment localy
  */
function updateComments() {
  var commentsContainer = document.getElementById("comments-container");
  commentsContainer.innerHTML = "";

  for (var i = 0; i < commentsArray.length; i++) {
    var commentDiv = document.createElement("div");
    commentDiv.classList.add("comment");

    var nameHeading = document.createElement("h3");
    nameHeading.textContent = commentsArray[i].userId;

    var commentParagraph = document.createElement("p");
    commentParagraph.textContent = commentsArray[i].comment;

    commentDiv.appendChild(nameHeading);
    commentDiv.appendChild(commentParagraph);

    commentsContainer.appendChild(commentDiv);
  }
}
