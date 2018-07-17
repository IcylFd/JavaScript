window.onload = function () {
	var aImg = document.querySelectorAll(".slider-panner");
	var aSliderBtn = document.querySelectorAll(".slider-btn")
	var index = 0;

	setInterval(function(){
		aImg[index].classList.remove("active");
		aSliderBtn[index].classList.remove("selected");
		if(index == 2){
			index = -1;
		}
		aImg[++index].classList.add("active");
		aSliderBtn[index].classList.add("selected");
	},2000)

	var aSearchBox = document.querySelector(".search-bar-box");
	aSearchBox.onclick = function(){
		this.classList.add("focus");
	}
	aSearchBox.onblur = function(){
		this.classList.remove("focus");
	}
	


}