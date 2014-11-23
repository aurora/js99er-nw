(function() {
    var gui = require('nw.gui');

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
        label: 'Preferences',
        click: function () {
            gui.Window.open('prefs.html', {toolbar: false});
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

    var software = new Software();

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
                            console.log(path);
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

    // help menu
    var help_item = new gui.MenuItem({label: 'Help'});
    var help_menu = new gui.Menu();

    help_menu.append(new gui.MenuItem({label: 'About'}));

    help_item.submenu = help_menu;
    menubar.append(help_item);

    // attach
    gui.Window.get().menu = menubar;
})();
