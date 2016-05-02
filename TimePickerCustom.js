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

                var offset = configuration.defaultOffset || 0; // if defaultOffset is 1 defaultValue is hour -1

                minParams = { id: this.model.id, type: "min", offset: offset};
                maxParams = { id: this.model.id, type: "max", offset: offset};
                defParams = { id: this.model.id, type: "def", offset: offset};
                
  
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
        } else {
            this.doRender();
        }
    },
    doRender: function () {
        LF.Widget.TimePicker.prototype.render.call(this);
    }
});

//Start of Time helper functions, define new functions within LF.TimeUtils
LF.TimeFunctions = {};

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
//        id:"TRN160_Q1", 
//        IG:"PracticeDiary", 
//        IT:"", 
//        text:["TRN160_Q1_MSG"], 
//        className:"TRN160_Q1", 
//        widget: 
//        {
//            id:"TRN160_Q1_W1", 
//            type:"TimePickerCustom", 
//            showLabels:false, 
//            configuration: 
//            {
//                minFunction: "genFun",
//                maxFunction: "genFun",
//                defFunction: "genFun",
//                minuteStep: 1
            
//            }
//        }
//    },

//USAGE
// {
//             id:"TRN170_Q1", 
//             IG:"MorningDiary", 
//             IT:"HIGBSS2L", 
//             text:["TRN170_MSG"], 
//             className:"TRN170_Q1", 
//             widget: {
//                 id:"TRN170_Q1_W1", 
//                 type:"TimePickerCustom", 
//                 showLabels:false, 
//                 configuration: 
//                 {
//                     minFunction: "genFun",
//                     maxFunction: "genFun",
//                     defFunction: "genFun",
//                     minuteStep: 1,
//                     defaultOffset: 1
                    
//                 }
//             }
//     },
