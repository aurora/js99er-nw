/**
 * Constructor.
 *
 * @param   ti994a      emu             Instance of emulator.
 */
function Debug(emu)
{
    this.emu = emu;

    this.memory_view = 0;
    this.memory_type = 0;

    this.disassembler = new Disassembler(emu.memory);
}

Debug.prototype.setEnable = (function() {
    var interval = null;

    return function(enable, $status, $memory) {
        var me = this;

        if (enable && !interval) {
            interval = window.setInterval(function() {
                $status.text(me.emu.getStatusString());
            }, 100);
        } else if (!enable && interval) {
            window.clearInterval(interval);
        }
    }
})();
