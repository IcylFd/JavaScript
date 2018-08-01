$(".nav-menu").on("click",function(){
  $(".overlay").addClass("active");
})
$(".close").on("click",function(){
  $(".overlay").removeClass("active");
})

var nowIndex = 0;
$("#right-arrow").on("click",function(){
  nowIndex ++;
  var runLeft = $(".slider-list li").width() * nowIndex;
  $(".slider-list").css({
    transform:'translateX('+(-runLeft)+'px)',
    transition:'all 1s ease'
  });

  setTimeout(function(){
    if(nowIndex == 3){
      nowIndex = 0;
      $(".slider-list").css({
        transition:'unset',
        transform:'translateX(0)',     
      });
    }
  },1000)
})