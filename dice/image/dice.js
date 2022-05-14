var randomno1=Math.floor(Math.random()*6) +1;
var randomDiceImage="image/d"+randomno1+".png";


var image1=document.querySelectorAll("img")[0];
image1.setAttribute("src",randomDiceImage);
