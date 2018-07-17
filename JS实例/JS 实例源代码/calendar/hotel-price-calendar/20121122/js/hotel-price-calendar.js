/**
 * 酒店价格日历组件
 * 
 * Author: Angtian
 * E-mail: Angtian.fgm@taobao.com
 */
KISSY.add('js/hotel-price-calendar', function(S) {

/**
 * @module hotel-price-calendar
 * @description 
 * - 酒店价格日历具有以下特点：
 * - 异步接收指定日期范围房态数据
 * - 日历上直接显示价格，如果房间数小于3间，显示“紧”标识
 * - 可设置日历显示范围（默认90天）
 * - 可设置入住日期跟离店日间的最大间隔（默认28天）
 * - 选择入住日期后，可根据参数设置（默认2天），自动计算离店日期，用户手动设置离店日期后，会自动记录日期间隔
 * - 选择离店日期后，会自动将入住日期设为日历的最小日期，最大日期为最大间隔天数对应的日期
 * - 鼠标移入日历，日期背景颜色会根据选择入住/离店来区分，入住颜色（#5792DC），离店颜色（#E2AD44）
 * - 选择入住/离店日期后，颜色标记连住日期（#D9F2FF）
 *
 * - 淘宝酒店宝贝详情页项目应用扩展功能
 * - 根据后端提供标识判断是否开启数据接口轮循功能
 * - 日历显示时进入轮循，1秒间隔，轮循10次，实时更新酒店数据。日历隐藏时停止轮循
 * - 酒店入住日期/离店日期选择校验
 */

var D      = S.DOM,
    each   = S.each,
    toHTML = S.substitute,

    IE     = S.UA.ie,
    
    REG    = /\d+/g,
    RDATE  = /^((19|2[01])\d{2})-(0?[1-9]|1[012])-(0?[1-9]|[12]\d|3[01])$/,

    BODY   = S.one('body'),
    WIN    = S.one(window),
    DOC    = S.one(document);

/**
 * 日期处理辅助函数
 * 
 * @name _DATE
 * @type {Object}
 * @private
 */    
var _DATE = {
    /**
     * 将日期字符串转为日期对象
     * 
     * @method _DATE#parse
     * @param {String} v 日期字符串
     * @private
     * @return {Date} 日期对象
     */
    parse: function(v) {
        v = v.match(REG);
        return v ? new Date(v[0], v[1] - 1, v[2]) : null;
    },
    
    /**
     * 将日期对象转为日期字符串
     * 
     * @method _DATE#stringify
     * @param {Date} v 日期对象
     * @private
     * @return {String} 日期字符串
     */
    stringify: function(v) {
        return v.getFullYear() + '-' + this.filled(v.getMonth() * 1 + 1) + '-' + this.filled(v.getDate());
    },
    
    /**
     * 获取指定日期的兄弟日期
     * 
     * @method _DATE#siblings
     * @param {String} v 日期字符串
     * @param {Number} n 间隔天数，支持负数
     * @private
     * @return {String} 日期字符串
     */     
    siblings: function(v, n) {
        v = v.match(REG);
        return this.stringify(new Date(v[0], v[1] - 1, v[2] * 1 + n));   
    },

    /**
     * 获取指定日期的兄弟月份
     * 
     * @method _DATE#siblingsMonth
     * @param {Date} v 日期对象
     * @param {Number} n 间隔月份，支持负数
     * @private
     * @return {String} 日期对象
     */     
    siblingsMonth: function(v, n) {
        return new Date(v.getFullYear(), v.getMonth() * 1 + n);  
    },
    
    /**
     * 数字不足两位前面补0
     * 
     * @method _DATE#filled
     * @param {Number} v 要补全的数字
     * @private
     * @return {String} 补0后的字符串
     */     
    filled: function(v) {
        return String(v).replace(/^(\d)$/, '0$1');
    },

    /**
     * 获取两个日期的间隔天数
     * 
     * @method _DATE#differ
     * @param {String} v1 日期对象
     * @param {String} v2 日期对象
     * @private
     * @return {Number} 间隔天数
     */     
    differ: function(v1, v2) {
        return parseInt(Math.abs(this.parse(v1) - this.parse(v2)) / 24 / 60 / 60 / 1000);    
    }
};
    
function Calendar() {
    Calendar.superclass.constructor.apply(this, arguments);
    this.initializer.apply(this, arguments);
}

return S.HotelPriceCalendar = S.extend(Calendar, S.Base, {

    /**
     * 日历初始化
     *
     * @method initializer
     */
    initializer: function() {
        this._clickoutside = function(e) {var target = S.one(e.target);target.hasClass(this._triggerNodeClassName) || target.parent('#' + this._calendarId) || this.hide();};
        // 如果没设置入住节点或离店节点，退出
        if(!this.get('checkInNode') || !this.get('checkOutNode')) return;
        this._setUniqueTag().renderUI();
    },
    
    /**
     * 渲染日历结构
     *
     * @method renderUI
     */
    renderUI: function() {
        BODY.append(this._initCalendar(this.get('date')));
        this.boundingBox  = S.one('#' + this._calendarId);
        this.dateBox      = this.boundingBox.one('.date-box');
        this.messageBox   = this.boundingBox.one('.message-box');
        this.checkInNode  = S.one(this.get('checkInNode')).addClass(this._triggerNodeClassName);
        this.checkOutNode = S.one(this.get('checkOutNode')).addClass(this._triggerNodeClassName);
        this.bindUI();
    },
    
    /**
     * 绑定事件
     *
     * @method bindUI
     */
    bindUI: function() {
        this.on('afterDataChange', this.render);
        this.on('afterMessageChange', this._setMessage);

        this.boundingBox.delegate('click', '.' + this._delegateClassName, this._DELEGATE.click, this);  
        this.boundingBox.delegate('mouseenter mouseleave', 'td', this._DELEGATE.mouse, this);
        
        DOC.delegate('focusin', '.' + this._triggerNodeClassName, this._DELEGATE.focusin, this);
        DOC.delegate('keydown', '.' + this._triggerNodeClassName, this._DELEGATE.keydown, this);
        DOC.delegate('click', '.' + this._triggerNodeClassName, this._DELEGATE.triggerNodeClick, this);

        WIN.on('resize', this._setPos, this);

        return this;
    },
    
    /**
     * 渲染日历
     * 
     * @method render
     */
    render: function() {
        this.dateBox.html(this._drawCalendar());
        this._setBtnStatus()._setDateStyle()._setWidth();
        this.fire('render');
        return this;
    },
    
    /**
     * 渲染下月日历
     *
     * @method nextMonth
     */
    nextMonth: function() {
        this.set('date', _DATE.siblingsMonth(this.get('date'), 1));
        this.render();
        this.fire('nextmonth');
        return this;
    },
    
    /**
     * 渲染上月日历
     *
     * @method prevMonth
     */
    prevMonth: function() {
        this.set('date', _DATE.siblingsMonth(this.get('date'), -1));
        this.render();
        this.fire('prevmonth');
        return this;
    },

    /**
     * 显示日历
     *
     * @method show
     */
    show: function() {
        DOC.on('click', this._clickoutside, this);

        this.boundingBox.show();
        this._setDefaultDate().render();
        this.fire('show', {'node': this.currentNode});
        return this;
    },

    /**
     * 隐藏日历
     *
     * @method hide
     */
    hide: function() {
        DOC.detach('click', this._clickoutside, this);

        this.boundingBox.hide();
        this.hideMessage();
        this.currentNode.getDOMNode()._selected = null;
        this._cacheNode = null;
        this.fire('hide', {'node': this.currentNode});
        return this;
    },

    /**
     * 显示提示信息
     * 
     * @method showMessage
     */
    showMessage: function() {
        (function(that) {
            that.fire('showmessage');
            setTimeout(function() {
                that.messageBox.addClass('visible');
            }, 5);
        })(this);
        return this;
    },
    
    /**
     * 隐藏提示信息
     * 
     * @method hideMessage
     */
    hideMessage: function() {
        this.messageBox.removeClass('visible');
        this.fire('hidemessage');
        return this;
    },

    /**
     * 日期点击处理函数
     *
     * @method _dateClick
     */
    _dateClick: function(o) {
        this.currentNode.val(o.date);

        (function(that, boundingBox, node, date, checkin, checkout, maxInterval) {
            /* 离店日期点击处理---------------------------------------------------------------*/
            if(that.dateBox.hasClass('check-out')) {
                that.set('checkout', date);
                boundingBox.all('td').removeClass('check-out');
                node.addClass('check-out');
                checkin && that.set('intervalDays', _DATE.differ(that.get('minDate'), date));
                return;
            }
            /* 入住日期点击处理---------------------------------------------------------------*/
            that.set('checkin', date);
            boundingBox.all('td').removeClass('check-in');
            node.addClass('check-in');

            if(!checkin && checkout && _DATE.parse(date) < _DATE.parse(checkout)) {
                that.set('intervalDays', Math.min(_DATE.differ(date, checkout), maxInterval));
            }

            var maxDate = that._setMaxDate(_DATE.siblings(date, that.get('intervalDays')));

            that.set('checkout', maxDate);
            that.checkOutNode.val(maxDate);
        })(this, this.boundingBox, o.node, o.date, this.get('checkin'), this.get('checkout'), this.get('maxInterval'));

        this.hide();

        return this;
    },

    /**
     * 设置日历显示位置
     *
     * @method _setPos
     * @private
     */
    _setPos: function() {
        (function(that, currentNode) {
            if(!currentNode) return;
            setTimeout(function() {
                var iLeft              = currentNode.offset().left,
                    iTop               = currentNode.offset().top + currentNode.outerHeight(),
                    iBoundingBoxWidth  = that.boundingBox.outerWidth(),
                    iBoundingBoxHeight = that.boundingBox.outerHeight(),
                    iCurrentNodeWidth  = currentNode.outerWidth(),
                    iCurrentNodeHeight = currentNode.outerHeight(),
                    iMaxLeft           = D.docWidth() * 1 + D.scrollLeft() - iBoundingBoxWidth,
                    iMaxTop            = D.docHeight() * 1 + D.scrollTop() - iBoundingBoxHeight;
                (function(t, l) {
                    if(iTop > iMaxTop) iTop = t < 0 ? iTop : t;
                    if(iLeft > iMaxLeft) iLeft = l < 0 ? iLeft : l;
                })(iTop - iBoundingBoxHeight - iCurrentNodeHeight, iLeft + iCurrentNodeWidth - iBoundingBoxWidth);
                that.boundingBox.css({
                    top : iTop,
                    left: iLeft
                });             
            }, 10);
        })(this, this.currentNode);
        return this;
    },

    /**
     * 设置日历提示信息
     * 
     * @method _setMessage
     * @private
     */
    _setMessage: function() {
        this.messageBox.html(this.get('message'));
        return this;
    },

    /**
     * 事件代理
     * 
     * @type {Object}
     */
    _DELEGATE: {
        // 日历点击事件处理函数
        'click': function(e) {
            var target = S.one(e.target),
                parent = target.parent('td');

            e.halt();

            switch(!0) {
                case target.hasClass('prev-btn'):
                    this.prevMonth();
                    break;
                case target.hasClass('next-btn'):
                    this.nextMonth();
                    break;
                case parent && parent.hasClass(this._delegateClassName):
                    var date = parent.attr('data-date');

                    this._dateClick({
                        'node': parent,
                        'date': date
                    });
                    this.fire('dateclick', {'date': date});
                    break;
            }
        },

        // 鼠标移入/移出事件处理函数
        'mouse': function(e) {
            var target = S.one(e.currentTarget);

            if(!target.hasClass('disabled')) target.toggleClass('active');
        },

        // 入住/离店节点focusin事件处理函数
        'focusin': function(e) {
            var target = this.currentNode = S.one(e.currentTarget);

            // 标记入住日历/离店日历。离店日历有className[check-out]
            this.dateBox[!!S.indexOf('#' + target.attr('id'), [this.get('checkInNode'), this.get('checkOutNode')]) ? 'addClass' : 'removeClass']('check-out');
            
            this.hideMessage()._setPos();

            // 当缓存触发节点与当前触发节点不匹配时，调用一次hide方法
            this._cacheNode && this._cacheNode.getDOMNode() != target.getDOMNode() && this.hide();

            // 当日历隐藏时，调用show方法
            this.boundingBox.css('display') == 'none' && this.show();

            // 重新设置缓存触发节点
            this._cacheNode = target;
        },

        // 触发元素keydown
        'keydown': function(e) {
            if(e.keyCode != 9) return;
            this.hide();
        },

        // 触发元素select
        'triggerNodeClick': function(e) {
            var target = e.currentTarget;

            if(target._selected) return;

            target.select();
            target._selected = true;
        }
    },
    
    /**
     * 获取指定日期房态
     *
     * @method _getRoomStatus
     * @param  {String} v 日期字符串
     * @return {Boolean} true/false
     */
    _getRoomStatus: function(v) {
        var oData = this.get('data');
        return oData && oData[v] && oData[v].price > 0 && oData[v].roomNum > 0;
    },

    /**
     * 获取指定日期状态
     *
     * @method _getDateStatus
     * @param {String} 日期字符串
     * @private
     * @return {Boolean} true/false
     */
    _getDateStatus: function(v) {
        return (this.get('minDate') && _DATE.parse(v) < _DATE.parse(this.get('minDate'))) || 
               (this.get('maxDate') && _DATE.parse(v) > _DATE.parse(this.get('maxDate')));
    },

    /**
     * 获取nodeList中匹配自定义属性的node
     * 
     * @method _getAttrNode
     * @param {Object} nodeList
     * @param {String} attr 自定义属性
     * @param {String} value 自定义属性值
     * @return node
     */
    _getAttrNode: function(nodeList, attr, value) {
        var node = null;
        each(nodeList, function(o) {
            if(S.one(o).attr(attr) === value) {
                return node = S.one(o);
            }
        });
        return node;
    },
    
    /**
     * 设置唯一标记
     *
     * @method _setUniqueTag
     * @private
     */
    _setUniqueTag: function() {
        (function(that, guid) {
            that._calendarId           = 'calendar-' + guid;
            that._delegateClassName    = 'delegate-' + guid;
            that._triggerNodeClassName = 'trigger-node-' + guid;
        })(this, S.guid());
        return this;
    },

    /**
     * 设置上/下月按钮状态
     *
     * @method _setBtnStatus
     * @private
     */
    _setBtnStatus: function() {
        var curDate = +_DATE.siblingsMonth(this.get('date'), 0),
            maxDate = this.get('maxDate'),
            minDate = this.get('minDate'),
            prevBtn = this.boundingBox.one('.prev-btn'),
            nextBtn = this.boundingBox.one('.next-btn');
        
        minDate && (minDate = +_DATE.parse(minDate));
        maxDate && (maxDate = +_DATE.siblingsMonth(_DATE.parse(maxDate), 0));

        prevBtn[curDate <= (minDate || Number.MIN_VALUE) ? 'hide' : 'show']();
        nextBtn[curDate >= (maxDate || Number.MAX_VALUE) ? 'hide' : 'show']();
        
        return this;
    },

    /**
     * 设置触发元素默认值对应的日期
     * 
     * @method _setDefaultDate
     */
    _setDefaultDate: function() {
        var checkin  = this.checkInNode.val(),
            checkout = this.checkOutNode.val();

        this.set('checkin', RDATE.test(checkin) ? checkin : '');
        this.set('checkout', RDATE.test(checkout) ? checkout : '');
        this.set('date', this.currentNode.val() || this.get('date'));

        var today       = this.get('today'),
            maxDate     = this.get('maxDate'),
            maxInterval = this.get('maxInterval');
        
        switch(this.currentNode.attr('id')) {
            case this.get('checkInNode').substr(1):
                this.set('minDate', today);
                this.set('maxDate', _DATE.siblings(today, this.get('maxCheckout') - 1));
                S.log(this.get('maxDate'));
                break;
            case this.get('checkOutNode').substr(1):
                if(!this.get('checkin')) return this;
                this.set('minDate', _DATE.parse(today) > _DATE.parse(checkin) ? today : checkin);
                this._setMaxDate(_DATE.siblings(checkin, this.get('maxInterval')));
                break;
        }

        return this;
    },

    /**
     * 设置可操作最大日期
     *
     * @method _setMaxDate
     * @param  {String} checkout 离店日期 YYYY-MM-DD
     * @private
     * @return {String} 可操作最大日期 YYYY-MM-DD
     */
    _setMaxDate: function(checkout) {
        var maxCheckout = _DATE.siblings(this.get('today'), this.get('maxCheckout'));
            this.set('maxDate', _DATE.parse(checkout) > _DATE.parse(maxCheckout) ? maxCheckout : checkout);
            return this.get('maxDate');
    },

    /**
     * 设置日历宽度
     *
     * @method _setWidth
     * @private
     */
    _setWidth: function() {
        var boundingBox = this.boundingBox,
            dateBox     = this.dateBox;

        // 如果包含优惠，重新设置日历框宽度
        if(this.get('promotions')) {
            var contentBox = dateBox.parent(),
                width      = boundingBox.one('.inner').outerWidth() + boundingBox.one('.discount').outerWidth();

            dateBox.css('width', width);
            boundingBox.one('.container').css('width', width + parseInt(contentBox.css('paddingLeft')) + parseInt(contentBox.css('paddingRight')));
            this._syncHeight();
        }

        // ie6处理
        if(IE == 6) {
            boundingBox.one('iframe').css({
                'width' : boundingBox.outerWidth(),
                'height': boundingBox.outerHeight()
            });
        }
        
        return this;
    },

    /**
     * 设置日期样式
     *
     * @method _setDateStyle
     * @private
     */
    _setDateStyle: function() {
        var boundingBox   = this.boundingBox,
            startDate     = this.get('checkin'),
            endDate       = this.get('checkout'),
            iDiff         = _DATE.differ(startDate, endDate),
            aTd           = boundingBox.all('td'),
            oTd           = null
            oStartDate    = startDate && this._getAttrNode(aTd, 'data-date', startDate),
            oEndDate      = endDate && this._getAttrNode(aTd, 'data-date', endDate);

        aTd.removeClass('check-in').removeClass('check-out').removeClass('selected-range');

        oStartDate && oStartDate.addClass('check-in');
        
        oEndDate && oEndDate.addClass('check-out');

        if(_DATE.parse(startDate) > _DATE.parse(endDate)) return this; 

        for(var i = 0; i < iDiff - 1; i++) {
            startDate = _DATE.siblings(startDate, 1);
            oTd       = this._getAttrNode(aTd, 'data-date', startDate);
            oTd && oTd.addClass('selected-range');
        }
        return this;

    },

    /**
     * 同步优惠信息容器与日历容器的高度
     *
     * @method [name]
     * @private
     */
    _syncHeight: function() {
        if(!this.get('promotions')) return this;

        var height   = this.dateBox.height(),
            discount = this.boundingBox.one('.discount'),
            line     = discount.one('.line');

        discount.css('height', height);
        line.css('height', height - 4);
        return this;
    },
    
    /**
     * 初始化日历结构
     *
     * @method _initCalendar
     * @private
     */
    _initCalendar: function() {
        return toHTML(Calendar.CALENDAR_TEMPLATE, 
               {
                   'bounding_box_id' : this._calendarId,
                   'date_template'   : this._drawCalendar(),
                   'message_template': this.get('message'),
                   'delegate'        : this._delegateClassName,
                   'iframe'          : IE == 6 ? '<iframe></iframe>' : ''
               });
    },
    
    /**
     * 绘制日历
     *
     * @method _drawCalendar
     * @private
     */
    _drawCalendar: function() {
        var date      = this.get('date'),
            iYear     = date.getFullYear(),
            iMonth    = date.getMonth() + 1,
            firstDays = new Date(iYear, iMonth - 1, 1).getDay(),
            monthDays = new Date(iYear, iMonth, 0).getDate(),
            weekdays  = [{wd: '日', weekend: 'weekend'},
                         {wd: '一'},
                         {wd: '二'},
                         {wd: '三'},
                         {wd: '四'},
                         {wd: '五'},
                         {wd: '六', weekend: 'weekend'}];

        var weekday_template = '';
            each(weekdays, function(v) {
                weekday_template +=
                    toHTML(Calendar.HEAD_TEMPLATE, {weekday_name: v.wd, weekend: v.weekend || ''});
            });

        var body_template = '',
            days_array    = [];

        for(;firstDays--;) days_array.push(0);
        for(var i = 1; i <= monthDays; i++) days_array.push(i);
        
        var rows  = Math.ceil(days_array.length / 7),
            oData = this.get('data');

        for(var i = 0; i < rows; i++) {

            var calday_row = '';
            
            for(var j = 0; j <= 6; j++) {
                var days = days_array[j + 7 * i] || '';
                var date = days ? iYear + '-' + _DATE.filled(iMonth) + '-' + _DATE.filled(days) : '';
                calday_row += 
                    toHTML(Calendar.DAY_TEMPLATE,
                        {
                            'day'        : days,
                            
                            'date'       : date,
                            
                            'disabled'   : this._getDateStatus(date) || !days ? 'disabled' : this._delegateClassName,
                            
                            'checkin'    : (date != '' && this.get('checkin') == date) ? ' check-in' : '',
                            
                            'checkout'   : (date != '' && this.get('checkout') == date) ? ' check-out' : '',
                            
                            'ico'        : !this._getDateStatus(date) && this._getRoomStatus(date) && oData && oData[date].roomNum < 3 ? '<i></i>' : '',
                            
                            'price_class': !this._getDateStatus(date) && oData ? this._getRoomStatus(date) ? 'price' : 'no-room' : 'nothing',
                            
                            'price'      : !this._getDateStatus(date) && oData ? (this._getRoomStatus(date) ? '\u00a5' + oData[date].price : '无房') : (days && oData ? '--' : '')
                        }
                    )  
            }

            body_template += toHTML(Calendar.BODY_TEMPLATE, {calday_row: calday_row});
        }                    

        var table_template = {
                'head_template': weekday_template,
                'body_template': body_template
            };

        var promotions = this.get('promotions');

        var calendar_template = {
                'date'               : iYear + '年' + iMonth + '月',
                'table_template'     : toHTML(Calendar.TABLE_TEMPLATE, table_template),
                'promotions_template': promotions ? toHTML(Calendar.PROMOTIONS_TEMPLATE, {price: promotions.price, savePrice: promotions.savePrice}) : ''
            };

        return toHTML(Calendar.DATE_TEMPLATE, calendar_template);
    }
}, 
{
    CALENDAR_TEMPLATE: '<div id="{bounding_box_id}" class="price-calendar-bounding-box">' +
                            '{iframe}' +
                            '<div class="container">' +
                                '<div class="message-box">' +
                                    '{message_template}' +
                                '</div>' +
                                '<div class="content-box">' +
                                    '<div class="arrow">' +
                                        '<span class="prev-btn {delegate}" title="上月">prev</span>' +
                                        '<span class="next-btn {delegate}" title="下月">next</span>' +
                                    '</div>' +                               
                                    '<div class="date-box">' +
                                        '{date_template}' +
                                    '</div>' +
                                    '<div class="bottom">' +
                                        '<p class="legend">' +
                                            '<span class="check-in">入住</span><span class="check-out">离店</span><span class="room-status">数量小于3间，请及时预订或与卖家联系</span>' +
                                        '</p>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>',
                        
    DATE_TEMPLATE: '<div class="inner">' +
                        '<h4>' +
                            '{date}' +
                        '</h4>' +
                        '{table_template}' +
                    '</div>' +
                    '{promotions_template}',

    PROMOTIONS_TEMPLATE: '<div class="inner discount">' +
                             '<span class="line"></span>' +
                             '<ul>' +
                                 '<li class="discount-txt">' +
                                     '优惠后总价:' +
                                 '</li>' +
                                 '<li class="discount-price">' +
                                     '<span class="rmb">&yen;</span>' +
                                     '<span>{price}</span>' +
                                 '</li>' +
                                 '<li class="discount-line"></li>' +
                                 '<li>' +
                                     '共节省费用:' +
                                 '</li>' +
                                 '<li>' +
                                     '&yen; {savePrice}' +
                                 '</li>' +
                             '</ul>' +
                        '</div>',
                        
    TABLE_TEMPLATE: '<table>' +    
                        '<thead>' +
                            '<tr>' +
                                '{head_template}' +
                            '</tr>' +
                        '</thead>' +                        
                        '<tbody>' +
                            '{body_template}' +
                        '</tbody>' +                    
                    '</table>',
                    
    HEAD_TEMPLATE: '<th class="{weekend}">{weekday_name}</th>',
    
    BODY_TEMPLATE: '<tr>' +
                        '{calday_row}' +
                    '</tr>',
                    
    DAY_TEMPLATE: '<td data-date="{date}" class="{disabled}{checkin}{checkout}{delegate}">' +
                        '<ul>' +
                            '<li class="date">' +
                                '<span>' +
                                    '{day}' +
                                '</span>' +
                                '{ico}' +
                            '</li>' +
                            '<li class="{price_class}">' +
                                '{price}' +
                            '</li>' +
                        '</ul>' +
                    '</td>',
                     
    NAME: 'HotelPriceCalendar',

    ATTRS: {

        /**
         * 今天的日期
         *
         * @attribute today 
         * @type {String} 日期字符串 YYYY-MM-DD
         * @default 今天日期
         */
        today: {
            value: _DATE.stringify(new Date)
        },

        /**
         * 日历初始日期
         *
         * @attribute date
         * @type {String|DATE} 日期字符串(YYYY-MM-DD)或日期对象(new Date)
         * @default 今天日期
         */
        date: {
            value: new Date(),
            setter: function(v) {
                if(!S.isDate(v)) {
                    v = RDATE.test(v) ? v : new Date();
                }
                return v;
            },            
            getter: function(v) {
                if(S.isDate(v)) {
                    return v;
                }
                else if(S.isString(v)) {
                    return _DATE.parse(v);
                }
            }
        },
       
        /**
         * 最小入住日期
         *
         * @attribute minDate
         * @type {String|DATE} 日期字符串(YYYY-MM-DD)或日期对象(new Date)
         * @default null
         */
        minDate: {
            value: null,
            setter: function(v) {
                if(S.isDate(v)) {
                    v = _DATE.stringify(v);
                }
                return RDATE.test(v) ? v : null;
            },
            getter: function(v) {
                if(S.isString(v)) {
                    v = _DATE.stringify(_DATE.parse(v));
                }
                return v || this.get('today');
            }
        },
        
        /**
         * 最大入住日期
         *
         * @attribute maxDate
         * @type {String|DATE} 日期字符串(YYYY-MM-DD)或日期对象(new Date)
         * @default null
         */
        maxDate: {
            value: null,
            setter: function(v) {
                if(S.isDate(v)) {
                    v = _DATE.stringify(v);
                }
                return RDATE.test(v) ? v : null;
            },
            getter: function(v) {
                if(S.isString(v)) {
                    v = _DATE.stringify(_DATE.parse(v));
                }
                return v || _DATE.siblings(this.get('minDate'), this.get('maxCheckout'));
            }
        },

        /**
         * 最大离店日期与最小入住日期的间隔天数
         *
         * @attribute maxCheckout
         * @type {Number}
         * @default 90
         */
        maxCheckout: {
            value: 90
        },

        /**
         * 入住日期与离店日期的最大间隔天数
         *
         * @attribute maxInterval
         * @type {Number}
         * @default 28
         */
        maxInterval: {
            value: 28
        },

        /**
         * 入住日期与离店日期的间隔天数
         *
         * @attribute intervalDays
         * @type {Number}
         * @default 2
         */
        intervalDays: {
            value: 2,
            getter: function(v) {
                return v * 1 || 2;
            }
        },
            
        /**
         * 酒店房态数据
         *
         * @attribute data
         * @type {Object}
         * @default null
         */
        data: {
            value: null
        },
           
        /**
         * 入住日期
         *
         * @attribute checkin
         * @type {String} 日期字符串  YYYY-MM-DD
         * @default 空
         */

        checkin: {
            value: ''
        },
        
        /**
         * 离店日期
         *
         * @attribute checkout
         * @type {String} 日期字符串 YYYY-MM-DD
         * @default 空
         */
        checkout: {
            value: ''
        },

        /**
         * 提示信息
         *
         * @attribute message
         * @type {String}
         * @default ''
         */
        message: {
            value: ''
        },

        /**
         * 优惠信息
         *
         * @attribute promotions
         * @type {String}
         * @default null
         */
        promotions: {
            value: null,
            getter: function(v) {
                if(!S.isObject(v) || S.isEmptyObject(v) || !v.price || !v.savePrice) return null;
                return v;
            }
        }
    }
});

}, {requires: ['css/hotel-price-calendar.css']});