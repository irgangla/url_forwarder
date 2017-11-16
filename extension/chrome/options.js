/*! 
 *  \brief     URL Forwarder
 *  \details   This extension allows redirection, forwarding and native handling of links.
 *  \author    Thomas Irgang
 *  \version   1.0
 *  \date      2017
 *  \copyright MIT License
 Copyright 2017 Thomas Irgang

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var api = chrome;

var rules = [];

function updateRule() {
    var index = this.value;
    console.log("Update rule " + index);
    rules[index].enabled = document.getElementById('rule_enabled_' + index).checked;
    rules[index].pattern = document.getElementById('rule_pattern_' + index).value;
    rules[index].target = document.getElementById('rule_target_' + index).value;
    rules[index].action = document.getElementById('rule_action_' + index).value;
    rules[index].redirect = document.getElementById('rule_redirect_' + index).value;
    
    saveRules();
    
    console.log(JSON.stringify(rules[index]));
}

function deleteRule() {
    var index = this.value;
    console.log("Delete rule " + index);
    var new_rules = [];
    for(var i=0; i<rules.length; i++) {
        if(i != index) {
            new_rules.push(rules[i]);
        }
    }
    rules = new_rules;
    renderRules();
    saveRules();
}

function renderRules() {
    var rules_table = document.getElementById('rules');

    // remove ruls
    while (rules_table.children.length > 1) 
    {
        rules_table.removeChild(rules_table.children[rules_table.children.length - 1])
    }
    
    // add rules
    for (var i = 0; i < rules.length; ++i) {
        var rule = rules[i];
        
        console.log("Render rule" + i + ": " + JSON.stringify(rule));
        
        var row = document.createElement('tr');
        var col_enabled = document.createElement('td');
        col_enabled.style = 'text-align: center;';
        var col_pattern = document.createElement('td');
        var col_target = document.createElement('td');
        var col_action = document.createElement('td');
        var col_redirect = document.createElement('td');
        var col_delete = document.createElement('td');
        var col_save = document.createElement('td');
        
        var checkbox = document.createElement('input');
        checkbox.checked = rule.enabled;
        checkbox.type = 'checkbox';
        checkbox.id = 'rule_enabled_' + i;
        col_enabled.appendChild(checkbox);
        row.appendChild(col_enabled);
        
        var text_pattern = document.createElement('input');
        text_pattern.value = rule.pattern;
        text_pattern.type = 'input';
        text_pattern.id = 'rule_pattern_' + i;
        col_pattern.appendChild(text_pattern);
        row.appendChild(col_pattern);
        
        var text_target = document.createElement('input');
        text_target.value = rule.target;
        text_target.type = 'input';
        text_target.id = 'rule_target_' + i;
        col_target.appendChild(text_target);
        row.appendChild(col_target);
        
        var option_action = document.createElement('select');
        option_action.id = 'rule_action_' + i;
        
        var opt_stay = document.createElement('option');
        opt_stay.innerText = "stay";
        opt_stay.value = 0;
        if(rule.action == 0) {
            opt_stay.selected = true;
        }
        option_action.appendChild(opt_stay);
        var opt_block = document.createElement('option');
        opt_block.innerText = "block";
        opt_block.value = 1;
        if(rule.action == 1) {
            opt_block.selected = true;
        }
        option_action.appendChild(opt_block);
        var opt_redirect = document.createElement('option');
        opt_redirect.innerText = "redirect";
        opt_redirect.value = 2;
        if(rule.action == 2) {
            opt_redirect.selected = true;
        }
        option_action.appendChild(opt_redirect);
        
        col_action.appendChild(option_action);
        row.appendChild(col_action);
        
        var text_redirect = document.createElement('input');
        text_redirect.value = rule.redirect;
        text_redirect.type = 'input';
        text_redirect.id = 'rule_redirect_' + i;
        col_redirect.appendChild(text_redirect);
        row.appendChild(col_redirect);
        
        var btn_delete = document.createElement('button');
        btn_delete.onclick = deleteRule;
        btn_delete.innerText = "X";
        btn_delete.id = "del_" + i;
        btn_delete.value = i;
        col_delete.appendChild(btn_delete);
        row.appendChild(col_delete);
        
        var btn_save = document.createElement('button');
        btn_save.onclick = updateRule;
        btn_save.innerText = "Save";
        btn_save.id = "save_" + i;
        btn_save.value = i;
        col_save.appendChild(btn_save);
        row.appendChild(col_save);
        
        rules_table.appendChild(row);
    }
}

function addRule() {
    console.log("Add rule");
    var rule = {};
    rule.enabled = true;
    rule.pattern = document.getElementById('pattern').value;
    rule.target = document.getElementById('target').value;
    rule.action = document.getElementById('action').value;
    rule.redirect = document.getElementById('redirect').value;
    
    console.log(JSON.stringify(rule));
    
    rules.push(rule);
    renderRules();
    saveRules();
}

function actionChanged() {
    if(document.getElementById('action').value == 2) {
        document.getElementById('redirect').disabled = false;
    } else {
        document.getElementById('redirect').disabled = true;
        document.getElementById('redirect').value = "";
    }
}

function loadRules() {
    console.log("load rules");
    api.storage.sync.get("rules", (data) => {
        rules = api.runtime.lastError ? [] : data["rules"];
        console.log("Loaded rules: " + JSON.stringify(rules));
        renderRules();
    });
}


function saveRules() {
    console.log("Save rules");
    var data = {};
    data["rules"] = rules;
    api.storage.sync.set(data, () => {
        if(api.runtime.lastError) {
            console.log("Save error!");
        } else {
            console.log("Rules saved.");
        }
        api.runtime.sendMessage({"kind": "rules_updated", "rules": rules});
    });
}

function setup() {
    loadRules();
    
    document.getElementById('add').onclick = addRule;
    document.getElementById('action').onchange = actionChanged;
    document.getElementById('refresh').onclick = loadRules;
    
    console.log("Options loaded.");
}

window.onload = setup;
