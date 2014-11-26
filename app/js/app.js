var gui = require('nw.gui');
var fs = require('fs');

var software = new Software();

function App() {
}

App.prototype.openRpkModule = function(file) {
    software.loadRPKModuleFromFile(
        file,
        function(cart) {
            ti994a.loadSoftware(cart);
        },
        function(err) {
            alert(err);
        }
    );
}

App.prototype.createScreenshot = function(filename) {
    var url = $('#canvas').get(0).toDataURL();

    fs.writeFile(
        filename,
        url.replace(/^data:image\/(png|jpg|jpeg);base64,/, ''),
        'base64',
        function(err) {
            if (err) {
                alert(err);
            }
        }
    );
}

App.prototype.buildMenu = function() {
    var menubar = new gui.Menu({type: 'menubar'});

    if (process.platform === 'darwin') {
        menubar.createMacBuiltin('js99er', {
            hideEdit: true,
            hideWindow: true
        });
    }

    // file menu
    var file_item = new gui.MenuItem({label: 'File'});
    var file_menu = new gui.Menu();

    file_menu.append(new gui.MenuItem({
        label: 'Open RPK module...',
        click: function() {
            $('#open-rpk-module').trigger('click');
        }
    }));
    file_menu.append(new gui.MenuItem({type: 'separator'}));
    file_menu.append(new gui.MenuItem({
        label: 'Save screenshot...',
        click: function() {
            $('#save-screenshot').trigger('click');
        }
    }));

    if (process.platform !== 'darwin') {
        file_menu.append(new gui.MenuItem({type: 'separator'}));
        file_menu.append(new gui.MenuItem({label: 'Quit'}));
    }

    file_item.submenu = file_menu;
    menubar.append(file_item);

    // software menu
    var sw_item = new gui.MenuItem({label: 'Software'});
    var sw_menu = new gui.Menu();

    (function buildPreloads(menu, programs, path) {
        path = path || '';

        for (var i = 0; i < programs.length; i++) {
            if (programs[i].type == Software.TYPE_GROUP) {
                menu.append((function(menu_item) {
                    menu_item.submenu = new gui.Menu();

                    buildPreloads(menu_item.submenu, programs[i].programs, path + i + '.');

                    return menu_item;
                })(new gui.MenuItem({label: programs[i].name})));
            } else if (programs[i].type == Software.TYPE_DIVIDER) {
                menu.append(new gui.MenuItem({type: 'separator'}));
            } else {
                menu.append(new gui.MenuItem({
                    label: programs[i].name,
                    click: (function(path) {
                        return function() {
                            software.getProgram(path, function(sw) {
                                if (sw != null) {
                                    ti994a.loadSoftware(sw);
                                }
                            });
                        }
                    })(path + i)
                }));
            }
        }
    })(sw_menu, software.getPrograms());

    sw_item.submenu = sw_menu;
    menubar.append(sw_item);

    // options menu
    var option_item = new gui.MenuItem({label: 'Options'});
    var option_menu = new gui.Menu();

    option_menu.append(new gui.MenuItem({
        type:    'checkbox',
        label:   'Sound enabled',
        checked: settings.isSoundEnabled(),
        click:   function() {
            settings.setSoundEnabled(this.checked);
            ti994a.tms9919.setSoundEnabled(this.checked);
        }
    }));
    option_menu.append(new gui.MenuItem({
        type:    'checkbox',
        label:   'Speech hack enabled',
        checked: settings.isSpeechEnabled(),
        click:   function() {
            settings.setSpeechEnabled(this.checked);
            ti994a.tms5220.setSpeechEnabled(this.checked);
        }
    }));
    option_menu.append(new gui.MenuItem({
        type:    'checkbox',
        label:   '32K RAM expansion enabled',
        checked: settings.is32KRAMEnabled(),
        click:   function() {
            settings.set32KRAMEnabled(this.checked);
            ti994a.tms5220.set32KRAMEnabled(this.checked);
        }
    }));
    option_menu.append(new gui.MenuItem({
        type:    'checkbox',
        label:   'F18A enabled',
        checked: settings.isF18AEnabled(),
        click:   function() {
            settings.setF18AEnabled(this.checked);
            var running = ti994a.isRunning();
            ti994a.stop();
            ti994a = new TI994A($('#canvas'), diskImages, settings, onBreakpoint);
            if (running) {
                ti994a.start();
            }
        }
    }));
    option_menu.append(new gui.MenuItem({
        type:    'checkbox',
        label:   'Sprite flicker enabled (9918A only)',
        checked: settings.isFlickerEnabled(),
        click:   function() {
            settings.setFlickerEnabled(this.checked);
            if (ti994a.vdp.setFlicker) {
                ti994a.vdp.setFlicker(this.checked);
            }
        }
    }));
    option_menu.append(new gui.MenuItem({
        type:    'checkbox',
        label:   'PC keyboard enabled',
        checked: settings.isPCKeyboardEnabled(),
        click:   function() {
            settings.setPCKeyboardEnabled(this.checked);
            ti994a.keyboard.setPCKeyboardEnabled(this.checked);
        }
    }));

    option_item.submenu = option_menu;
    menubar.append(option_item);

    // debug menu
    var debug_item = new gui.MenuItem({label: 'Debug'});
    var debug_menu = new gui.Menu();

    debug_menu.append(new gui.MenuItem({
        label: 'Emulator',
        click: function() {
            var win = gui.Window.open('debug.html', {toolbar: false});
            win.on('close', function() {
                global.emu.debug.setEnable(false);
                win.close(true);
            });
        }
    }));
    debug_menu.append(new gui.MenuItem({
        label: 'Webkit',
        click: function() {
            gui.Window.get().showDevTools();
        }
    }));

    debug_item.submenu = debug_menu;
    menubar.append(debug_item);

    // help menu
    var help_item = new gui.MenuItem({label: 'Help'});
    var help_menu = new gui.Menu();

    help_menu.append(new gui.MenuItem({label: 'About'}));

    help_item.submenu = help_menu;
    menubar.append(help_item);

    // attach
    gui.Window.get().menu = menubar;
}
