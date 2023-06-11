/*
  Responsible for presenting the ads(check if user is a subscriber or not)
*/
fetch("http://localhost:8080/ads", request)
  .then((response) => {
    response.json().then((res) => {
      console.log(res.premium);
      if (res.premium) {
        const blackRectangles =
          document.getElementsByClassName("black-rectangle");
        for (let i = 0; i < blackRectangles.length; i++) {
          blackRectangles[i].style.visibility = "hidden";
        }
      } else {
        console.log(res.premium);
      }
    });
  })
  .catch((error) => console.log("Error: ", error));
