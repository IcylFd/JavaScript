var board = new Array();
var score = 0;
var hasConflited = new Array();

$(function () {

    newgame();
});

function newgame(){
    init();
    generateOneNumber();
    generateOneNumber();
    score=0;
    updateScore(score);
}

    $("#new-button").click(
        function() {
            //初始化棋盘格
            newgame();
        }
    );

    function init() {
        for(var i = 0; i < 4; i++)
            for (var j = 0; j < 4; j++) {
                var gridCell = $("#grid-cell-" + i + "-" + j);
                gridCell.css("top", getPosTop(i,j)+"px");
                gridCell.css("left", getPosLeft(i,j)+"px");
            }

        for(var i = 0; i < 4; i++){
            board[i]=new Array();
            hasConflited[i] = new Array();
            for(var j = 0; j < 4; j++){
                board[i][j] = 0;
                hasConflited[i][j] = false;
           }
        }

        updateBoardView();
    }

    function updateBoardView(){
        $(".number-cell").remove();
        for(var i = 0; i < 4; i++)
            for(var j = 0; j < 4; j++){
                $("#grid-container").append('<div class="number-cell" id="number-cell-'+i+'-'+j+'"></div>');
                var theNumberCell = $("#number-cell-"+i+"-"+j);

                if(board[i][j] == 0){
                    theNumberCell.css("height","0px");
                    theNumberCell.css("width","0px");
                    theNumberCell.css("top",getPosTop(i,j)+50);
                    theNumberCell.css("left",getPosLeft(i,j)+50);
                }
                else{
                    theNumberCell.css("height","100px");
                    theNumberCell.css("width","100px");
                    theNumberCell.css("top",getPosTop(i,j));
                    theNumberCell.css("left",getPosLeft(i,j));
                    theNumberCell.css("background-color",getNumberBackgroundColor(board[i][j]));
                    theNumberCell.css("color",getNumberColor(board[i][j]));
                    theNumberCell.text(board[i][j]);
                }

                hasConflited[i][j] = false;
            }

    }

    function generateOneNumber() {
        if(nospace(board))
            return false;

        //随机一个位置
        var randx = parseInt(Math.random() * 4);
        var randy = parseInt(Math.random() * 4);
        var time = 0;

        while( time < 50 ){
            if(board[randx][randy] == 0)    //判断坐标是否可用
                break;

            randx = parseInt(Math.random() * 4);
            randy = parseInt(Math.random() * 4);
            time++;
        }
        if(time == 50){
            for(var i = 0; i < 4; i++)
                for(var j = 0; j < 4; j++){
                    if(board[i][j] == 0){
                        randx = i;
                        randy = j;
                    }
                }
        }

        //随机一个数字
        var randNumber = Math.random() < 0.5 ? 2 : 4;
        //在随机位置显示随机数字
        board[randx][randy] = randNumber;
        showNumberWithAnimation(randx,randy,randNumber);
        return true;
    }

function isgameover(){
    if(nospace(board) && nomove(board))
        gameover();
}

function gameover(){
    alert("gameover!");
}
$(document).keydown(function(event) {
    event.preventDefault();
    switch (event.keyCode) {
        case 37:   //left
            if( moveLeft() ){
                setTimeout("generateOneNumber()",210);
                setTimeout("isgameover()",300);
            }
            break;
        case 38:   //up
            if( moveUp() ){
                setTimeout("generateOneNumber()",210);
                setTimeout("isgameover()",300);
            }
            break;
        case 39:   //right
            if( moveRight() ){
                setTimeout("generateOneNumber()",210);
                setTimeout("isgameover()",300);
            }
            break;
        case 40:   //down
            if( moveDown() ){
                setTimeout("generateOneNumber()",210);
                setTimeout("isgameover()",300);
            }
            break;
        default:
            break;
    }
});

function moveLeft(){
    if( !canMoveLeft(board) )   //判断能否向左移动
        return false;

    //moveLeft
    for(var i = 0; i < 4; i++)
        for(var j = 1; j < 4; j++){
            if(board[i][j] != 0){
                for(var k = 0; k < j; k++){
                    if(board[i][k] == 0 && noBlockHorizontal(i, k, j, board) && !hasConflited[i][k]){
                        //move
                        showMoveAnimation(i, j, i, k);
                        board[i][k] = board[i][j];
                        board[i][j] = 0;

                    }
                    else if(board[i][k] == board[i][j] && noBlockHorizontal(i, k, j, board)){
                        //move
                        showMoveAnimation(i, j, i, k);
                        //add
                        board[i][k] += board[i][j];
                        board[i][j] = 0;
                        score += board[i][k];
                        updateScore(score);
                        hasConflited[i][k] = true;
                    }
                }
            }
        }
    setTimeout('updateBoardView()',200);
    return true;
}

function moveUp(){
    if( !canMoveUp(board) )
        return false;

    for(var i = 1; i < 4; i++)
        for(var j = 0; j < 4; j++){
            if(board[i][j] != 0){
                for(var k = 0; k < i; k++){
                    if(board[k][j] == 0 && noBlockVertical(j, k, i, board)  && !hasConflited[k][j]){
                        showMoveAnimation(i, j, k, j, board);
                        board[k][j] = board[i][j];
                        board[i][j] = 0;
                    }
                    else if(board[k][j] == board[i][j] && noBlockVertical(j, k, i, board)){
                        showMoveAnimation(i, j, k, j, board);
                        board[k][j] += board[i][j];
                        board[i][j] = 0;
                        score += board[k][j];
                        updateScore(score);
                        hasConflited[i][k] = true;
                    }
                }
            }
        }

    setTimeout('updateBoardView()',200);
    return true;
}

function moveRight(){
    if( !canMoveRight(board) )
        return false;

    for(var i = 0; i < 4; i++)
        for(var j = 0; j < 3; j++){
            if(board[i][j]!=0){
                for(var k = 3; k > j; k--){
                    if(board[i][k] == 0 && noBlockHorizontal(i, j, k, board)  && !hasConflited[i][k]){
                        showMoveAnimation(i, j, i, k, board);
                        board[i][k] = board[i][j];
                        board[i][j] = 0;
                    }
                    else if(board[i][k] == board[i][j] && noBlockHorizontal(i, j, k, board)){
                        showMoveAnimation(i, j, i, k, board);
                        board[i][k] += board[i][j];
                        board[i][j] = 0;
                        score += board[i][k];
                        updateScore(score);
                        hasConflited[i][k] = true;
                    }
                }
            }
        }

    setTimeout("updateBoardView()",200);
    return true;
}

function moveDown(){
    if( !canMoveDown(board) )
        return false;

    for(var i = 0; i < 3; i++)
        for(var j = 0; j < 4; j++){
            if(board[i][j]!=0){
                for(var k = 3; k > i; k--){
                    if(board[k][j] == 0 && noBlockVertical(j, i, k, board) && !hasConflited[k][j]){
                        showMoveAnimation(i, j, k, j, board);
                        board[k][j] = board[i][j];
                        board[i][j] = 0;
                    }
                    else if(board[k][j] == board[i][j] && noBlockVertical(j, i, k, board)){
                        showMoveAnimation(i, j, k, j, board);
                        board[k][j] += board[i][j];
                        board[i][j] = 0;
                        score += board[k][j];
                        updateScore(score);
                        hasConflited[i][k] = true;
                    }
                }
            }
        }

    setTimeout("updateBoardView()",200);
    return true;
}


















