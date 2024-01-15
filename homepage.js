// ref: https://stackoverflow.com/q/67322922/387194
var __EVAL = (s) => eval(`void (__EVAL = ${__EVAL}); ${s}`);
jQuery(function($, undefined) {
    $('#term_demo').terminal(function(command) {
        if (command !== '') {
            try {
                var result = __EVAL(command);
                if (result !== undefined) {
                    this.echo(new String(result));
                }
            } catch(e) {
                this.error(new String(e));
            }
        } else {
        this.echo('');
        }
    }, {
        greetings: 'JavaScript Interpreter',
        name: 'js_demo',
        height: 200,
        prompt: 'js> '
    });
});