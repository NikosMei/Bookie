//Form fields
let title = document.getElementById("title"); //Title of the book
let author = document.getElementById("author"); //Author of the book
let genre = document.getElementById("genre"); //Categories that the book is in
let summary = document.getElementById("summary"); //Summary of the book
let size = document.getElementById("size"); //Size of the book(pdf file)
let pdfFile = document.getElementById("pdfFile"); //Pdf file of the book
let coverImage = document.getElementById("coverImage"); //CoverImage of the book
let audioBook = document.getElementById("audioBook"); //Audio Book(if present)

let uploadButton = document.getElementById("upload-button"); //Submit button

/*
  Upload all the info to the server so that the book is saved and ready to be displayed to the users
*/
uploadButton.onclick = function () {
  let category = createArrayOfStrings(genre.value);
  fetch("/numBooks", { method: "GET" }).then((response) => {
    response.json().then((res) => {
      console.log(res.numbooks);
      if (validateForm()) {
        let metadata = {
          id: res.numbooks + 1,
          title: title.value,
          author: author.value,
          category: category,
          size: size.value,
        };
        postJSON(metadata); //Send all the metadata that are given in the form
        convertInputFileToBlob(pdfFile)
          .then((pdfBlb) => {
            postBlobFile("/uploadbookfile", pdfBlb, "application/pdf"); //Convert the pdf file to a blob and upload it
          })
          .then(() => {
            convertInputFileToBlob(coverImage).then((coverBlb) => {
              postBlobFile("/uploadbookcover", coverBlb, "image/png"); //Convert the png file to a blob and upload it
            });
          })
          .then(() => {
            convertInputFileToBlob(audioBook).then((coverBlb) => {
              postBlobFile("/uploadaudiobook", coverBlb, "image/png"); //Convert the mp3 file to a blob and upload it
            });
          });
      }
    });
  });
};

/*
  Receives a file as input and converts it to a blob
*/
function convertInputFileToBlob(inputFile) {
  var file = inputFile.files[0]; // Get the selected file from the input element

  return new Promise((resolve, reject) => {
    if (file) {
      var reader = new FileReader();

      reader.onloadend = function () {
        var blob = new Blob([reader.result], { type: file.type });
        resolve(blob);
      };

      reader.onerror = function (error) {
        reject(error);
      };

      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error("No file selected."));
    }
  });
}

/*
  Receives a url which is the location in which to send the file
  Receives a blob which is the file to be sent
  Receives the type of the file to be sent
*/
async function postBlobFile(url, blob, type) {
  return fetch(url, {
    method: "POST",
    body: blob,
    headers: {
      "Content-Type": type,
    },
  })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Error posting the file.");
      }
      return response.json();
    })
    .catch(function (error) {
      console.error(error);
    });
}

/*
  Responsible to upload all the metadata of the book 
*/
async function postJSON(data) {
  try {
    const response = await fetch("http://localhost:8080/uploadbookmetadata", {
      method: "POST", // or 'PUT'
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    console.log("Success:", result);
  } catch (error) {
    console.error("Error:", error);
  }
}

/*
  Creates an array of strings from a given text
*/
function createArrayOfStrings(text) {
  // Remove leading and trailing whitespace from the text
  var trimmedText = text.trim();

  // Split the text into an array of strings based on spaces
  var arrayOfStrings = trimmedText.split(" ");

  return arrayOfStrings;
}

/*
  Validate that each necessary is filled
*/
function validateForm() {
  // Get the values of all the fields
  var titleValue = title.value.trim();
  var authorValue = author.value.trim();
  var genreValue = genre.value.trim();
  var summaryValue = summary.value.trim();
  var sizeValue = size.value.trim();
  var pdfFileValue = pdfFile.value.trim();
  var coverImageValue = coverImage.value.trim();

  // Check if any of the fields is empty
  if (
    titleValue === "" ||
    authorValue === "" ||
    genreValue === "" ||
    summaryValue === "" ||
    sizeValue === "" ||
    pdfFileValue === "" ||
    coverImageValue === ""
  ) {
    alert("Please fill in all fields.");
    return false;
  }

  // Check if the size field is a positive number
  if (isNaN(sizeValue) || sizeValue <= 0) {
    alert("Size must be a positive number.");
    return false;
  }

  // Check if the pdfFile field has a PDF file selected
  var pdfExtension = pdfFileValue.split(".").pop().toLowerCase();
  if (pdfExtension !== "pdf") {
    alert("Please select a PDF file.");
    return false;
  }

  // Check if the coverImage field has a PNG image selected
  var imageExtension = coverImageValue.split(".").pop().toLowerCase();
  if (imageExtension !== "png") {
    alert("Please select a PNG image for the cover.");
    return false;
  }

  // All fields are valid
  return true;
}

function showCategories() {
  var categories = document.querySelector(".categories");
  categories.classList.add("show");
}

function hideCategories() {
  var categories = document.querySelector(".categories");
  categories.classList.remove("show");
}
