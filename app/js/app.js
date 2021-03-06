var gui = require('nw.gui');
var fs = require('fs');

var software = new Software();
software.loadRPKModuleFromURL = function(module, onSuccess, onError) {
    var file = new File(process.cwd() + '/emu/src/' + module, module);

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

function App() {
}

App.prototype.processArgv = function() {
    if (gui.App.argv.length > 0) {
        var file = gui.App.argv[0];

        var ext = file.split('.').pop();

        if (ext != null && (ext.toLowerCase() == "rpk" || ext.toLowerCase() == "zip")) {
            if (fs.existsSync(file)) {
                this.openRpkModule(new File(file, require('path').basename(file)));
            }
        }
    } else {
        software.getProgram('0', function(sw) {
            if (sw != null) {
                ti994a.loadSoftware(sw);
            }
        });
    }
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

    // run menu
    var run_item = new gui.MenuItem({label: 'Run'});
    var run_menu = new gui.Menu();

    run_menu.append(run_item_start = new gui.MenuItem({
        label:   'Start',
        enabled: !ti994a.isRunning(),
        click:   function() {
            ti994a.start(false);
        }
    }));
    run_menu.append(run_item_stop = new gui.MenuItem({
        label:   'Stop',
        enabled: ti994a.isRunning(),
        click:   function() {
            run_item_start.enabled = true;
            run_item_stop.enabled = false;

            ti994a.stop();
        }
    }));
    run_menu.append(run_item_reset = new gui.MenuItem({
        label:   'Reset',
        enabled: ti994a.isRunning(),
        click:   function() {
            ti994a.reset(true);

            if (!ti994a.isRunning()) {
                run_item_start.enabled = false;
                run_item_stop.enabled = true;

                ti994a.start(false);
            }
        }
    }));

    run_item.submenu = run_menu;
    menubar.append(run_item);

    // options menu
    function tiReset() {
        var running = ti994a.isRunning();
        ti994a.stop();
        ti994a = new TI994A($('#canvas').get(0), diskImages, settings);
        if (running) {
            ti994a.start();
        }
    }

    var option_item = new gui.MenuItem({label: 'Options'});
    var option_menu = new gui.Menu();

    option_menu.append(new gui.MenuItem({
        type:    'checkbox',
        label:   'Sound enabled',
        checked: settings.isSoundEnabled(),
        click:   function() {
            settings.setSoundEnabled(this.checked);
            sound.setSoundEnabled(state);
        }
    }));
    option_menu.append(new gui.MenuItem({
        type:    'checkbox',
        label:   'Speech enabled',
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
        label:   'SAMS enabled',
        checked: settings.isAMSEnabled(),
        click:   function() {
            settings.setAMSEnabled(this.checked);
            ti994a.memory.setAMSEnabled(this.checked);
            tiReset();
        }
    }));
    option_menu.append(new gui.MenuItem({
        type:    'checkbox',
        label:   'GRAM enabled',
        checked: settings.isGRAMEnabled(),
        click:   function() {
            settings.setGRAMEnabled(this.checked);
            ti994a.memory.setGRAMEnabled(this.checked);
            tiReset();
        }
    }));
    option_menu.append(new gui.MenuItem({
        type:    'checkbox',
        label:   '4 sprites per line limitation enabled',
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
        label:   'F18A enabled',
        checked: settings.isF18AEnabled(),
        click:   function() {
            settings.setF18AEnabled(this.checked);
            ti994a.setVDP(settings);
            window.setTimeout(function() { tiReset(); }, 500);
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
    option_menu.append(new gui.MenuItem({
        type:    'checkbox',
        label:   'Map arrow keys to Fctn+SDEX enabled',
        checked: settings.isMapArrowKeysToFctnSDEXEnabled,
        click:   function() {
            settings.setMapArrowKeysToFctnSDEXEnabled(this.checked);
            ti994a.keyboard.setMapArrowKeysToFctnSDEXEnabled(this.checked);
        }
    }));
    option_menu.append(new gui.MenuItem({
        type:    'checkbox',
        label:   'Google drives (GDR1, GDR2, GDR3) enabled',
        checked: settings.isGoogleDriveEnabled(),
        click:   function() {
            settings.setGoogleDriveEnabled(this.checked);
            ti994a.setGoogleDrive(settings);
            tiReset();
        }
    }));
/*    option_menu.append(new gui.MenuItem({
        type:    'checkbox',
        label:   'Pixelated image (if supported by browser)',
        checked: settings.isPixelatedEnabled(),
        click:   function() {
            settings.setPixelatedEnabled(this.checked);
            $('#canvas').toggleClass('pixelated', this.checked);
        }
    })); */

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
