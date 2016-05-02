
/** #depends Base.js
 * @file Defines a number input widget.
 * @author <a href="mailto:boley@phtcorp.com">Brian Oley</a>
 * @version 1.5
 */

LF.Widget.NumberInput = LF.Widget.Base.extend(
        /** @lends LF.Widget.NumberInput.prototype */
                {
                    /**
                     * The template of the number input element
                     * @type String
                     * @default 'DEFAULT:NumberInput'
                     */
                    inputTemplate: 'STUDY:NumberInput',
                    /**
                     * The maximum number of allowed digits. At 16 digits the iphone begins converting values to exponent
                     * @type Number
                     * @default 15
                     */
                    maxDigits: 15,
                    /**
                     * LF.Widget.NumberInput's constructor function.
                     * @class Initialize a new NumberInput widget
                     * @params {Object} [options] An object containing options
                     * @constructs
                     */
                    initialize: function (options) {
                        var config = this.model.get('config');

                        this.options = options;
                        this.min = config.min;
                        this.max = config.max;
                        this.regex = config.regex || 'integer';
                        this.label = config.label;

                        LF.Widget.Base.prototype.initialize.call(this, options);
                    },
                    /**
                     * Responsible for displaying the widget.
                     * @returns '{@link LF.Widget.NumberInput}'
                     */
                    render: function () {
                        if (this.label) {
                            LF.getStrings(this.label, function (strings) {
                                label = strings;
                            }, {namespace: this.parent.parent.id});
                        }else{
                            label = ""; // Evans fix problem. now you don't have to provide a 'label' at all if not needed.
                        }

                        var answer = (this.answer ? this.answer.get('response') : ""),
                                inputId = this.model.get('id'),
                                parent = this.parent,
                                numberInputElement = LF.Resources.Templates.display(this.inputTemplate, {
                                    id: inputId,
                                    maxlength: this.model.get('maxDigits') || this.maxDigits,
                                    label: label,
                                    minValue: this.min,
                                    maxValue: this.max
                                });

                        this.$el.html(numberInputElement)
                                .appendTo(parent.$el)
                                .trigger('create');

                        this.$el.find('input[type="number"]').on('input', _(function () {
                            //parent.validate();
                            this.respond();
                        }).bind(this));

                        this.delegateEvents();

                        this.$el.find('#' + inputId).val(answer);

                        return this;
                    },
                    /**
                     * Validate the widget.
                     * @return {Boolean} Returns true if the widget is valid, otherwise false
                     * @example this.validate();
                     */
                    validate: function () {
                        return this.doValidate(true);
                    },
                    doValidate: function (finalValidation) {
                        var regex,
                                value = this.$el.find('input[type="number"]').val(),
                                maxDigits = this.model.get('maxDigits') || this.maxDigits,
                                maxValue = this.max,
                                minValue = this.min;

                        switch (this.regex) {
                            case 'integer' :
                                //TODO: this regex prevents leading zeros, but only allows up to three digits
                                regex = /^([0-9]|[1-9][0-9]|[1-9][0-9][0-9])$/;
                                break;
                            default :
                                // custom regex
                                regex = this.regex;
                        }

                        //If decimal regex and only whole number entered, add '.0'
                        if (finalValidation && regex.source.indexOf('.') != -1 && value && value.indexOf('.') == -1) {
                            value += ".0";
                            this.$el.find('input[type="number"]').val(value);
                            this.respond();
                        }

                        // Test if the value string contains only an integer.
                        if ((finalValidation && this.completed) || (!this.mandatory && value === "") || ((value.length <= maxDigits) && regex.test(value)
                                && (maxValue == null || Number(value) <= maxValue) && (minValue == null || Number(value) >= minValue))) {

                            //this.respond();
                            //LF.Notify.Banner.closeAll();

                            return true;
                        } else {
                            if (finalValidation && value) {
                                LF.Actions.notify({message: 'EDIT_CHECK'}, function (result) {
                                });
                            }
                            return false;
                        }
                    },
                    /**
                     * Responds, saving response after validation.
                     * @example this.response();
                     */
                    respond: function () {
                        var value = this.$el.find('input[type="number"]').val();

                        if (!this.answers.size()) {
                            this.answer = this.addAnswer();
                        }

                        LF.Widget.Base.prototype.respond.call(this, this.answer, value, this.doValidate(false));
                    }
                }
        );

//USAGE example

// {
//         "id" : "TRN080_Q1",
//         "IG" : "PracticeDiary",
//         "repeating": true,
//         "IT" : "HRSMIS1N",
//         "text" : [
//             "TRN080_Q1_MSG"
//         ],
//         "className" : "TRN080_Q1",
//         "widget" : {
//             "id" : "TRN080_Q1_W1",
//             "type" : "NumberInput",
//             "class" : "TRN080_W1",
//             "config" : {
//                 "defaultVal" : 0,
//                 "min" : 0,
//                 "max" : 24,
//                 "step" : 1,
//                 "precision" : 1,
//                 //"label" : "TRN080_NS_LABEL"
//             }
//         }
//     }
