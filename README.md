# js99er-nw

This is a node-webkit wrapper for the great [js99er](https://github.com/Rasmus-M/Js99er) TI-99/4A emulator by
Rasmus Moustgaard.

![start-screen](https://github.com/aurora/js99er-nw/raw/master/assets/start-screen.png)

## Usage

Currently there are no binary packages available. In the meantime you can run the application from
the 'app/' directory by running:

    nw .

(Assuming, that node-webkit's nw is available in your PATH).

Optionally a RPK module filename can be specified as command-line parameter, eg.:

    nw . ~/modules/munchman.rpk
