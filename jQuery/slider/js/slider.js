jQuery.fn.extend({
	slider:function(option){
		var defaultOption = {
			timer: 1000
		}
	}

	var newOption = $.extend({},defaultOption,option);

	var content = $("<div class='slider'></div>");
	var sliderList = "<div class='slider-panner sp-1 active'>"+"<img src='https://img.alicdn.com/simba/img/TB1XvxlubGYBuNjy0FoSuwiBFXa.jpg'></div>"+
			"<div class='slider-panner sp-2'>"+"<img src='https://aecpm.alicdn.com/simba/img/TB1W4nPJFXXXXbSXpXXSutbFXXX.jpg'></div>"+
			"<div class='slider-panner sp-3'>"+"<img src='https://aecpm.alicdn.com/simba/img/TB1_JXrLVXXXXbZXVXXSutbFXXX.jpg'></div>";
	var sliderBtn = '<div class="slider-nav"><ul>'+'<li class="slider-btn active"></li>'+
				'<li class="slider-btn"></li>'+'<li class="slider-btn"></li>'+'</ul></div>';

	content.html(sliderList + sliderBtn);
	$(this).append(content);

	var thisIndex=0;
    isrun = true;
    setInterval(function(){
      if(isrun){
        ++thisIndex;
        run()
      }
    },newOption.timer);
    function run(){
      if(thisIndex>=3){
        thisIndex = 0;
      }
      $(".slider-panner").eq(thisIndex).addClass("active").siblings().removeClass("active");
      $(".list-btn li").eq(thisIndex).addClass("active").siblings().removeClass("active");
    }
    $(".slider").hover(function(){
      isrun=false;
    },function(){
      isrun=true;
    })
    $(".list-btn li").on("mouseover",function(){
      thisIndex = $(this).index();
      run();
    })
    })