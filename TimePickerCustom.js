LF.Widget.TimePickerCustom = LF.Widget.TimePicker.extend({
    render: function () {
        if (!localStorage.getItem('ScreenshotMode')) {
            var configuration = this.model.get('configuration');

            var minFunction = (configuration.minFunction) ? LF.TimeFunctions[configuration.minFunction] : LF.TimeFunctions.NoopFunction,
                minParams = _.extend({}, configuration.minParams),
                maxFunction = (configuration.maxFunction) ? LF.TimeFunctions[configuration.maxFunction] : LF.TimeFunctions.NoopFunction,
                maxParams = _.extend({}, configuration.maxParams),
                defFunction = (configuration.defFunction) ? LF.TimeFunctions[configuration.defFunction] : LF.TimeFunctions.NoopFunction,
                defParams = _.extend({}, configuration.defParams);

            if ( configuration.simpleFunc ){

                var result = this.filterSimpleFunc((configuration.simpleFunc).split('~'));
                var minVal = new Date(result[0]), maxVal = new Date(result[1]), defVal = new Date(result[2]);
                
                if (minVal) {
                    var min = LF.Utilities.convertToUtc(new Date("1900-01-01"));
                    min.setHours(minVal.getHours(), minVal.getMinutes(), 0, 0);
                    this.model.attributes.min = min.ISOLocalTZStamp();
                }

                if (maxVal) {
                    //Sanitize values returned to all be on the same date
                    var max = LF.Utilities.convertToUtc(new Date("1900-01-01"));
                    max.setHours(maxVal.getHours(), maxVal.getMinutes(), 0, 0);
                    this.model.attributes.max = max.ISOLocalTZStamp();
                }
               
                if (defVal) {
                    //Sanitize values returned to all be on the same date
                    var def = LF.Utilities.convertToUtc(new Date("1900-01-01"));
                    def.setHours(defVal.getHours(), defVal.getMinutes(), 0, 0);
                    configuration.defaultValue = (Number(def.getTime())/1000);
                }

                this.doRender();

            }else{    
  
                minFunction(minParams, _(function (minVal) {
                    
                    if (minVal) {
                        //Sanitize values returned to all be on the same date
                        var min = LF.Utilities.convertToUtc(new Date("1900-01-01"));
                        min.setHours(minVal.getHours(), minVal.getMinutes(), 0, 0);

                        this.model.attributes.min = min.ISOLocalTZStamp();
                    }

                    maxFunction(maxParams, _(function (maxVal) {
                        if (maxVal) {
                            //Sanitize values returned to all be on the same date
                            var max = LF.Utilities.convertToUtc(new Date("1900-01-01"));
                            max.setHours(maxVal.getHours(), maxVal.getMinutes(), 0, 0);

                            this.model.attributes.max = max.ISOLocalTZStamp();
                        }

                        defFunction(defParams, _(function (defVal) {
                            if (defVal) {
                                //Sanitize values returned to all be on the same date
                                var def = LF.Utilities.convertToUtc(new Date("1900-01-01"));
                                def.setHours(defVal.getHours(), defVal.getMinutes(), 0, 0);

                                configuration.defaultValue = (Number(def.getTime())/1000);
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
        LF.Widget.TimePicker.prototype.render.call(this);
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
                bdate = LF.TimeFunctions.getActivationDate(hours);
                break;
            case 'current':
                bdate = LF.TimeFunctions.getCurrentDate(hours);
                break;
        }
        return bdate;
    }
});

//Start of Time helper functions, define new functions within LF.TimeUtils
LF.TimeFunctions = {};

//################################################

LF.TimeFunctions.getActivationDate = function (hours) {
    var val = new Date(LF.Data.Subjects.at(0).get('activationDate'));
    val.setSeconds(0, 0);
    var fdate = new Date(val);
    if ( hours.startsWith('-')){

        var h = parseInt(hours.replace('-',''));
        if ( h > 0){
            val.setHours(val.getHours() - h);
        }    

    }else if ( hours.startsWith('=')){

        var h = parseInt(hours.replace('=',''));
        if (h > 0){
            var currentHour = val.getHours();
            if ( h === 12 && currentHour < 12){ //if hour to be adjust to 12 and now it's less than 12. midnight
                h.setHours(0,0,0,0);
            }else{
               val.setHours(h); 
            }
            
        }
        
    }else{
        if ( hours > 0){
            val.setHours(val.getHours() + parseInt(hours));
        }
        
        
    }
    val = LF.TimeFunctions.shiftDates(fdate,val);
    return val;
};

LF.TimeFunctions.getCurrentDate = function (hours) {
    
    var val = new Date();
    val.setSeconds(0, 0);
    var fdate = new Date(val);

    if ( hours.startsWith('-')){

        var h = parseInt(hours.replace('-',''));
        if ( h > 0){
            val.setHours(val.getHours() - h);
        }

    }else if ( hours.startsWith('=')){

        var h = parseInt(hours.replace('=',''));
        if ( h > 0 ){
            var currentHour = val.getHours();
            if ( h === 12 && currentHour < 12){ //if hour to be adjust to 12 and now it's less than 12. midnight
                val.setHours(0,0,0,0);
            }else{
               val.setHours(h); 
            }
            
        }
    }else{
        if ( hours > 0 ){
           val.setHours(val.getHours() + parseInt(hours)); 
        }
        
        
    }
    
    val = LF.TimeFunctions.shiftDates(fdate,val);
    return val;
};

LF.TimeFunctions.shiftDates = function (fdate,sdate){
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
//################################################
LF.TimeFunctions.genFun = function(params,callback){
    if (params.offset === 1){
        callback(LF.TimeFunctions.customAnonymous(params.type,params.id,true)); 
    }else{
        callback(LF.TimeFunctions.customAnonymous(params.type,params.id,false));
    }       
};

LF.TimeFunctions.customAnonymous = function(type,id,sister){
    var minStruct = {
        min :  (function(){
                    var reportDate = new Date(LF.Data.Questionnaire.Dashboard.get('report_date'));
                    var now = (LF.Data.Questionnaire) ? reportDate : new Date();
                    now.setHours(12);
                    return now;
                }),
                
        
        max :  (function(){
                    var reportDate = new Date(LF.Data.Questionnaire.Dashboard.get('report_date'));
                    var now = (LF.Data.Questionnaire) ? reportDate : new Date();
                    return now;
               }),
                
        def :  (function(){
                    var reportDate = new Date(LF.Data.Questionnaire.Dashboard.get('report_date'));
                    var now = (LF.Data.Questionnaire) ? reportDate : new Date();
                    if ( !sister){
                        now.setHours(now.getHours() - 1);
                    }
                    return now;
               }),
        
        
    }
    var retFun = minStruct[type];
    return retFun();
    
};


LF.TimeFunctions.genMin = function(params,callback){
    console.log("genMin params:", params.id);
    console.log("genMin params type:", params.type);
    var now = new Date();
    
    now.setHours(11, 30, 0, 0);
    callback(now);
};

LF.TimeFunctions.genMax = function(params,callback){
    console.log("genMax params:", params.id);
    var now = new Date();
    
    now.setHours(11, 30, 0, 0);

    callback(now);

};

LF.TimeFunctions.genDef = function(params,callback){
    console.log("genDef params:", params.id);
    var now = new Date();
    
    now.setHours(11, 30, 0, 0);
    callback(now);
};

//########################################################


//Default function, returns null
LF.TimeFunctions.NoopFunction = function (params, callback) {
    callback(null);
};

LF.TimeFunctions.getCurrentTime = function (params, callback) {
    var now = new Date();
    
    callback(now);
};

LF.TimeFunctions.getMidnight = function (params, callback) {
    var now = new Date();
    
    now.setHours(0, 0, 0, 0);
    callback(now);
};

LF.TimeFunctions.getMD050Min = function (params, callback) {
    var now = new Date();
    
    now.setHours(4, 0, 0, 0);
    callback(now);
};

LF.TimeFunctions.getMD050Max = function (params, callback) {
    var now = new Date();
    
    now.setHours(11, 30, 0, 0);
    callback(now);
};

//USAGE
// {
//     id:"TRN320_Q1", 
//     IG:"PracticeDiary", 
//     IT:"", 
//     text:["TRN320_Q1_MSG"], 
//     className:"TRN320_Q1", 
//     widget: 
//     {
//         id:"TRN320_Q1_W1", 
//         type:"TimePickerCustom", 
//         showLabels:false, 
//         configuration: 
//         {
//             minFunction: "genFun",
//             maxFunction: "genFun",
//             defFunction: "genFun",
//             "simpleFunc": "current =12~current 0~current 0",
//             minuteStep: 1
            
//         }
//     }
// },

//USAGE
// {
//     id:"TRN330_Q1", 
//     IG:"PracticeDiary", 
//     IT:"", 
//     text:["TRN330_Q1_MSG"], 
//     className:"TRN330_Q1", 
//     widget: 
//     {
//         id:"TRN330_Q1_W1", 
//         type:"TimePickerCustom", 
//         showLabels:false, 
//         configuration: 
//         {
//             minFunction: "genFun",
//             maxFunction: "genFun",
//             defFunction: "genFun",
//             "simpleFunc": "current =12~current 0~current -1",
//             minuteStep: 1
            
//         }
//     }
// },
