
var fs = require('fs');
var mkdirp = require('mkdirp');
var getDirName = require('path').dirname;

var replacePeriod = "JS_XX_JS";
var replaceId = "JS_id_JS";

function RtoJS(argName){
  var JSname = argName;
  if(argName == 'id'){
    return replaceId;
  }
  JSname = argName.split(".").join(replacePeriod);
  return JSname
}
function JStoR(jsArgName){
  var argName = jsArgName;
  if(jsArgName == replaceId){
    return "id";
  }
  argName = jsArgName.split(replacePeriod).join(".");
  return argName;
}

//read in json
var functionPackage = require('./'+process.argv[2]);
var tries = (process.argv[3])?process.argv[3]:functionPackage.funcs.length;
console.log(functionPackage.funcs.length);
functionPackage.funcs = functionPackage.funcs.slice((process.argv[4])?process.argv[4]:0, tries);
//console.log(functionPackage);

var f = functionPackage.funcs[0];
console.log(f);

function getNodeHTMLTemplate(f){

  var output = "";
  output += `
  <script type="text/javascript">

      var `+RtoJS(f.name)+`_DEFAULT_VALUES = {
        `
        f.args.forEach(function(arg, idx){
          if(idx > 0){
          output += ',';
          }
          output += '"'+RtoJS(arg.name) + '":"'+((typeof arg.defaultValue == 'string')?arg.defaultValue.split('\"').join('\\\"'):arg.defaultValue)+'"';
        });

output += `
      }


      function makeExpression`+RtoJS(f.name)+`(`;

        f.args.forEach(function(arg, idx){
          output += '_'+RtoJS(arg.name) + ',';
        });
        output += '_OUTPUT_VAR';

  output += "){\n";
  output += `
        var args = [];
  `
  f.args.forEach(function(arg, idx){
    output += `
    if(typeof _`+RtoJS(arg.name)+` != 'undefined' && _`+RtoJS(arg.name)+` != ''){
      args.push({"name":"`+RtoJS(arg.name)+`", "value":_`+RtoJS(arg.name)+`});
    }
    `
  });

  output += `var func = {};
  func.R_Function = true;
  func.args = args;
  func.name = "`+f.name+`";
  `
  output += `
  if(typeof _OUTPUT_VAR != 'undefined' && _OUTPUT_VAR != ''){
    func.outputVar=_OUTPUT_VAR;
  } else {
    func.outputVar = "`+f.name+`_OUTPUT";
  }
  return JSON.stringify(func);
  `

  /*

  output += "\t\t\tvar functionCall = \""+f.name+"_OUTPUT <- "+f.name+`(\"
    variables.forEach(function(variable, idx){
      if(idx > 0){
        functionCall += ", "
      }
      functionCall += variable.name+" = "+variable.value
    });
  return functionCall + ")"
  `
  */
  output +=    "\n\t}";
  output += `
    RED.nodes.registerType('`+f.category+`-`+RtoJS(f.name)+`',{
        category: \"`+f.category+`\",
        color: '#fdd0a2',
        defaults: {
            name: {value:""},
            `;
  f.args.forEach(function(arg, idx){
    output += "\t\t\t\t"+RtoJS(arg.name)+":{value:\""+((typeof arg.defaultValue == 'string')?arg.defaultValue.split('\"').join('\\\"'):arg.defaultValue)+"\"},\n";
  });
  output += `   outputVar: {value:"`+f.name+`_OUTPUT_VAR"},
              payload: {value:""},
              outputs: {value:1},
              noerr: {value:0,required:true,validate:function(v){ return ((!v) || (v === 0)) ? true : false; }}
          },
          inputs:1,
          outputs:1,
          icon: "`+f.category+`.png",
          label: function() {
          return this.name||"`+f.category+`-`+RtoJS(f.name)+`";
          },
          oneditprepare: function() {
          var node = this;
          $( "#node-input-outputs" ).spinner({
              min:1
          });

console.log('oneditprepare');
console.log($('#node-input-payload').val());
          if($('#node-input-payload').val() == ""){
console.log('payload is empty string')
              $('#node-input-payload').val(makeExpression`+RtoJS(f.name)+`(`
                f.args.forEach(function(arg, idx){
                if(idx > 0){
                output += ',';
                }
                output += " $('.arg-input."+RtoJS(arg.name)+"').val()";
                });
                output += ", $('.arg-input.outputVar').val()"

                output += '));'

            output += `
            $('.form-tips .generated-code').text($('#node-input-payload').val());
            node.payload = $('#node-input-payload').val();
          }

          $('.arg-input').on('keyup', function(evt){
            $('#node-input-payload').val(makeExpression`+RtoJS(f.name)+`(`
  f.args.forEach(function(arg, idx){
    if(idx > 0){
      output += ',';
    }
    output += " $('.arg-input."+RtoJS(arg.name)+"').val()";
  });
  output += ", $('.arg-input.outputVar').val()"

  output += '));'

  output += `
          $('.form-tips .generated-code').text($('#node-input-payload').val());
          node.payload = $('#node-input-payload').val();
        });


        },
        oneditsave: function() {
          this.payload = $('#node-input-payload').val();
        },
        oneditresize: function(size) {

        }
      });
      </script>

      <script type="text/x-red" data-template-name="`+f.category+`-`+RtoJS(f.name)+`">
        <div class="form-row">
        <label for="node-input-name"><i class="fa fa-tag"></i> <span data-i18n="common.label.name"></span></label>
        <input type="text" id="node-input-name" data-i18n="[placeholder]common.label.name">
        <input type="hidden" id="node-input-payload" value="">
        </div>
  `

  f.args.forEach(function(arg, idx){

    output += `
        <div class="form-row" style="margin-bottom: 0px;">
        <label for="node-input-`+RtoJS(arg.name)+`"><i class="fa fa-wrench"></i> <span>`+arg.name+`</span></label>
        <input type="text" id="node-input-`+RtoJS(arg.name)+`" class="arg-input `+RtoJS(arg.name)+`" />
        </div>
    `

  });

  output += `
      <div class="form-row" style="margin-bottom: 0px;">
      <label for="node-input-outputVar"><i class="fa fa-wrench"></i> <span>outputVar</span></label>
      <input type="text" id="node-input-outputVar" class="arg-input outputVar"/>
      </div>
  `

  output += `
        <div class="form-row">
        <label for="node-input-outputs"><i class="fa fa-random"></i> <span data-i18n="function.label.outputs"></span></label>
        <input id="node-input-outputs" style="width: 60px;" value="1">
        </div>
        <div class="form-tips"><span>See the Info tab for help writing R functions in NodeRed.<p><code class="generated-code"></code></p></span></div>
      </script>

      <script type="text/x-red" data-help-name="`+f.category+`-`+RtoJS(f.name)+`">
        `+f.doc+`
      </script>

  `
  return output;
}

function getNodeJSTemplate(f){
  var output = `
  module.exports = function(RED) {

      function `+RtoJS(f.name)+`Function(config) {
          RED.nodes.createNode(this,config);
          var node = this;
          node.name = config.name;
          console.log('show config.payload:'+config.payload);
          if(config.payload == ""){
            node.payload = {
              "R_Function":true,
              "name":"`+f.name+`",
              "args":[
`
              f.args.forEach(function(arg, idx){
                if(idx > 0){
                  output += ',';
                }
                console.log(typeof arg.defaultValue);
                console.log(arg.defaultValue);
                output += `{ "name":"`+arg.name+`",
                           "value":"`+((arg.defaultValue !="" && typeof arg.defaultValue === 'string')?arg.defaultValue.split('"').join("\\\""):arg.defaultValue)+`" }`
              });
              output += ` ]};

            } else {
              node.payload = config.payload;
            }

          this.on('input', function(msg) {
            if(typeof node.payload == 'object' && node.payload.R_Function){
                        var code = node.payload;
                        if(typeof msg.R_FunctionCalls == 'undefined'){
                          msg.R_FunctionCalls = {};
                          msg.R_FunctionCalls.funcs = [];
                        }
                        msg.R_FunctionCalls.funcs.push(code);
            }
            node.send(msg);
          });
      }
      RED.nodes.registerType("mlr-gen-`+RtoJS(f.name)+`",`+RtoJS(f.name)+`Function);
  }
    `

  return output;
}

function getNodePackageJSON(functionPackage){

  var output = `
  {
    "dependencies": {},
    "description": \"`+functionPackage.description+`\",
    "devDependencies": {},
    "name": "cbuscollab-`+functionPackage.category+`-nodes",
    "node-red": {
      "nodes": {
        `
        functionPackage.funcs.forEach(function(func, idx){
          if(idx > 0){
            output += ',';
          }
          output += `\"`+func.category+`-`+RtoJS(func.name)+`\":\"`+func.category+`/`+func.category+`-`+RtoJS(func.name)+`.js\"\n`
        });
  output += `
      }
    },
    "optionalDependencies": {},
    "readme": "`+functionPackage.description+`",
    "readmeFilename": "README.md",
    "version": "`+functionPackage.version+`"
  }
  `
  return output;
}

/*
console.log(getNodeHTMLTemplate(f));
console.log(getNodeJSTemplate(f));
console.log(getNodePackageJSON(functionPackage));
*/
createNodes(functionPackage);

function createNodes(functionPackage){

  function writeFile(path, contents, cb) {
    mkdirp(getDirName(path), function (err) {
      if (err) return cb(err);

      fs.writeFile(path, contents, cb);
    });
  }

  functionPackage.funcs.forEach(function(func){

    writeFile("./createNode/"+func.category+"/"+func.category+"-"+RtoJS(func.name)+".html", getNodeHTMLTemplate(func));
    writeFile("./createNode/"+func.category+"/"+func.category+"-"+RtoJS(func.name)+".js", getNodeJSTemplate(func));

  });
  writeFile("./createNode/package.json", getNodePackageJSON(functionPackage));
}