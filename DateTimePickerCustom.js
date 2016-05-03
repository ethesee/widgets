
LF.Widget.DateTimePickerCustom = LF.Widget.DateTimePicker.extend({
    //TODO: remove when fixed in product
    setWidgetDefaults: function () {
        var datePickerDate, timePickerDate;

        if (!this.datetimeVal) {
            datePickerDate = this.$('input.date-input').datebox('getTheDate');
            timePickerDate = this.$('input.time-input').datebox('getTheDate');
            datePickerDate.setHours(timePickerDate.getHours(), timePickerDate.getMinutes(), 0, 0);
            this.$('input.time-input').datebox('setTheDate', datePickerDate);
            this.datetimeVal = datePickerDate;
        } else {
            //Seems to fix PHT00161324
            this.$('input.date-input').datebox('setTheDate', this.datetimeVal);
            this.$('input.time-input').datebox('setTheDate', this.datetimeVal);
        }
    },
    render: function () {
        if (!localStorage.getItem('ScreenshotMode')) {
            var configuration = this.model.get('configuration');

            var minFunction = (configuration.minFunction) ? LF.DateTimeFunctions[configuration.minFunction] : LF.DateTimeFunctions.NoopFunction,
                minParams = _.extend({}, configuration.minParams),
                maxFunction = (configuration.maxFunction) ? LF.DateTimeFunctions[configuration.maxFunction] : LF.DateTimeFunctions.NoopFunction,
                maxParams = _.extend({}, configuration.maxParams),
                defFunction = (configuration.defFunction) ? LF.DateTimeFunctions[configuration.defFunction] : LF.DateTimeFunctions.NoopFunction,
                defParams = _.extend({}, configuration.defParams);
                
            if ( configuration.simpleFunc ){
                console.log("config:" + configuration.simpleFunc);
                var result = this.filterSimpleFunc((configuration.simpleFunc).split('~'));

                var minVal = new Date(result[0]), maxVal = new Date(result[1]), defVal = new Date(result[2]);

                this.model.attributes.min = minVal.ISOLocalTZStamp();
                this.model.attributes.max = maxVal.ISOLocalTZStamp();
               
                configuration.defaultValue = defVal.ISOLocalTZStamp();
                configuration.timeConfiguration.defaultValue = defVal.ISOLocalTZStamp();

                this.doRender();

            }else{

                minFunction(minParams, _(function (minVal) {
                    if (minVal) {
                        this.model.attributes.min = minVal.ISOLocalTZStamp();
                    }

                    maxFunction(maxParams, _(function (maxVal) {
                        if (maxVal) {
                            this.model.attributes.max = maxVal.ISOLocalTZStamp();
                        }

                        defFunction(defParams, _(function (defVal) {
                            if (defVal) {
                                configuration.defaultValue = defVal.ISOLocalTZStamp();
                                configuration.timeConfiguration.defaultValue = defVal.ISOLocalTZStamp();
                            }

                            this.doRender();
                        }).bind(this));
                    }).bind(this));
                }).bind(this));
            }
        } else {
            this.doRender();
        }
    },
    doRender: function () {
        LF.Widget.DateTimePicker.prototype.render.call(this);
    },
    //Below copied from product datetimepicker
    respond: function (e, params) {
        var value = params !== undefined ? this.buildStudyWorksString(params.date) : undefined,
            answered = (value !== undefined),
            tempDatetime;

        if (answered) {
            if ($(e.target).hasClass('date-input')) {
                //DE10700 Need to check if date change
                // make time to change - DST occurs
                tempDatetime = this.datetimeVal.copy();
                this.datetimeVal.setFullYear(params.date.getFullYear(), params.date.getMonth(), params.date.getDate());
                if (!this.$('input.time-input').datebox('checkLimits', this.datetimeVal) ||
                    (tempDatetime.getHours() !== this.datetimeVal.getHours() ||
                        tempDatetime.getMinutes() !== this.datetimeVal.getMinutes())) {
                    this.$('input.time-input').val('');
                }
            } else if ($(e.target).hasClass('time-input')) {
                this.datetimeVal.setHours(params.date.getHours(), params.date.getMinutes());
            }

            if (this.$('input.time-input').val() === '' || this.$('input.date-input').val() === '') {
                answered = false;
            }
            
            //kgonsalves: fire respond event even when partially answered
            //this is added in case you want to have a mutually exclusive screen where entering a date/time clears another widget
            if (!this.answers.size()) {
                this.answer = this.addAnswer();
            }
                
            if (answered) {
                value = this.buildStudyWorksString(this.datetimeVal);
                LF.Widget.Base.prototype.respond.call(this, this.answer, value, answered);
            } else {
                LF.Widget.Base.prototype.respond.call(this, this.answer, null, answered);
            }
        }
        //Store localized input into widget property to load back in
        this.localizedDate = this.$('input.date-input').val();
        this.localizedTime = this.$('input.time-input').val();
    },

    filterSimpleFunc: function(strings){
        var _this = this;
        var retArray = [];
        _.each(strings,function(item){
            var pItem = item;
            if (item.startsWith('activation') || item.startsWith('current')){
                pItem = _this.processBased(item);
            }      
            retArray.push(pItem);
        });
        return retArray;
    },
    processBased: function(item){
        var itemArray = item.split(' ');
        var idate = itemArray[0], hours = itemArray[1];

        var bdate = new Date();
        switch(idate){
            case 'activation':
                bdate = LF.DateTimeFunctions.getActivationDate(hours);
                break;
            case 'current':
                bdate = LF.DateTimeFunctions.getCurrentDate(hours);
                break;
        }
        return bdate;
    }
});



//Start of DateTime helper functions, define new functions within LF.DateTimeFunctions
LF.DateTimeFunctions = {};

LF.DateTimeFunctions.getActivationDate = function (hours) {
    var val = new Date(LF.Data.Subjects.at(0).get('activationDate'));
    val.setSeconds(0, 0);
    var fdate = new Date(val);
    if ( hours.startsWith('-')){

        var h = hours.replace('-','');
        val.setHours(val.getHours() - h);

    }else if ( hours.startsWith('=')){

        var h = hours.replace('=','');
        if ( h > 0){

            var currentHour = val.getHours();
            if ( h === 12 && currentHour < 12){ //if hour to be adjust to 12 and now it's less than 12. midnight
                val.setHours(0,0,0,0);
            }else{
                val.setHours(h); 
            }
        }
        
    }else{
        val.setHours(val.getHours() + parseInt(hours));
        
    }
    val = LF.DateTimeFunctions.shiftDates(fdate,val);
    return val;
};

LF.DateTimeFunctions.getCurrentDate = function (hours) {
    
    var val = new Date();
    val.setSeconds(0, 0);
    var fdate = new Date(val);
    
    if ( hours.startsWith('-')){

        var h = hours.replace('-','');
        val.setHours(val.getHours() - h);

    }else if ( hours.startsWith('=')){

        var h = hours.replace('=','');
        if ( h > 0){

            var currentHour = val.getHours();
            if ( h === 12 && currentHour < 12){ //if hour to be adjust to 12 and now it's less than 12. midnight
                val.setHours(0,0,0,0);
            }else{
                val.setHours(h); 
            }
        }
        
    }else{
        val.setHours(val.getHours() + parseInt(hours));
        
    }
    //console.log("returning val:", val);
    val = LF.DateTimeFunctions.shiftDates(fdate,val);
    return val;
};

LF.DateTimeFunctions.shiftDates = function (fdate,sdate){
    var fday = fdate.getDay();
    var sday = sdate.getDay();

    if ( sday > fday){
        
        fdate.setHours(23,59,0,0);
        return fdate;
    }else if ( sday < fday){
        
        fdate.setHours(0,0,0,0);
        return fdate;
    }
        
    return sdate;
    
}
//Default function, returns null
LF.DateTimeFunctions.NoopFunction = function (params, callback) {
    callback(null);
};

LF.DateTimeFunctions.getActivationTime = function (params, callback) {
    var val = new Date(LF.Data.Subjects.at(0).get('activationDate'));
    val.setSeconds(0, 0);
    callback(val);
};

LF.DateTimeFunctions.getCurrentTime = function (params, callback) {
    var val = new Date();
    val.setSeconds(0, 0);
    callback(val);
};

LF.DateTimeFunctions.getNumHoursAgo = function (params, callback) {
    LF.DateTimeFunctions.getCurrentTime(params, function (now) {  
        LF.DateTimeFunctions.getActivationTime(params, function (activationTS) {  
            var numHoursAgo = params.numHoursAgo || 0;

            now.setHours(now.getHours() - numHoursAgo);
    
            if (now.getTime() < activationTS.getTime()) {
                //Clip to activation
                callback(activationTS);
            } else {
                callback(now);
            }
        });
    });
};

LF.DateTimeFunctions.getTodayStarting = function (params, callback) {
    LF.DateTimeFunctions.getCurrentTime(params, function (now) {  
        LF.DateTimeFunctions.getActivationTime(params, function (activationTS) {  
            var startTime = params.startTime || "12:0:0:0";

            var timepieces = startTime.split(":"); 
            //Evans Thesee: Setting to 12 noon by default;
            now.setHours(parseInt(timepieces[0]),parseInt(timepieces[1]),parseInt(timepieces[2]),parseInt(timepieces[3]));
            
            callback(now);
            
        });
    });
};

LF.DateTimeFunctions.getScreenValue = function (params, callback) {
    var logger = Log4js.loggers['DateTimeFunctions:getScreenvalue'] ||
            new LF.Log.Logger('DateTimeFunctions:getScreenvalue'),
        responseDT = null,
        response;

    try {
        if (params.loopingIG) {
            var igr = LF.Utilities.getCurrentIGR(params.loopingIG);
            response = LF.Utilities.queryAnswersByQuestionIDAndIGR(params.questionID, igr)[0];

            if (response) {
                responseDT = new Date(response.get('response'));
            }
        } else {
            response = LF.Utilities.queryAnswersByID(params.questionID)[0];

            if (response) {
                responseDT = new Date(response.get('response'));
            }
        }
    } catch (ex) {
        logger.log(Log4js.Level.ERROR, 'Exception getting screen value: ' + ex);
    }

    callback(responseDT);
};

LF.DateTimeFunctions.getMidnightYesterday = function (params, callback) {
    LF.DateTimeFunctions.getActivationTime(params, function (activationTS) {
        var reportDate = LF.Utilities.convertToUtc(new Date(LF.Data.Questionnaire.Dashboard.get('report_date')));
        
        reportDate.setDate(reportDate.getDate() - 1);
    
        if (reportDate.getTime() < activationTS.getTime()) {
            //Clip to activation
            callback(activationTS);
        } else {
            callback(reportDate);
        }
    });
};


//USAGE
// {
//     "id": "TRN110_Q1",
//     "IG": "PracticeDiary",
//     "repeating": true,
//     "IT": "",
//     "text": [
//         "TRN110_Q1_MSG"
//     ],
//     "className": "TRN110_Q1",
//     "widget": {
//         "id": "TRN110_Q1_W1",
//         "type": "DateTimePickerCustom",
//         "showLabels": true,
//         "configuration": {
//             "defFunction": "getCurrentTime",
//             "minFunction": "getTodayStarting",
//             "maxFunction": "getCurrentTime",
//             "simpleFunc" : "current =1~current 2~current -12",
//             // "simpleFunc": (function(){
//             //     var dates = [];
//             //     var val = new Date();
                
//             //     var defVal = val.toString();
                
//             //     val.setSeconds(0, 0);
//             //     dates.push(val.toString());
                
//             //     val.setHours(val.getHours() + 3);
//             //     dates.push(val.toString());
                
//             //     dates.push(defVal);
//             //     return dates.join("~");
//             // })(),
//             "timeConfiguration": {
//             },
//             "minParams": {
//                 "startTime": "12:0:0:0"
//             }
//         }
//     }
// },