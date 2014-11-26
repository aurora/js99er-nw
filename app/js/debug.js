/**
 * Constructor.
 *
 * @param   this.emu      emu             Instance of emulator.
 */
function Debug(emu) {
    this.emu = emu;

    this.memory_view = 0;
    this.memory_type = 0;
    this.debugger_address = 0;

    this.disassembler = new Disassembler(emu.memory);
}

/**
 * Enable updating of debug view.
 *
 * @param   bool        enable          Enable/disable debug view.
 * @param   DOMNode     status          DOMNode of status view (only required if enable is true).
 * @param   DOMNode     memory          DOMNode of memory view (only required if enable is true).
 */
Debug.prototype.setEnable = (function() {
    var interval = null;

    return function(enable, status, memory) {
        var me = this;

        if (enable && !interval) {
            interval = window.setInterval(function() {
                status.text(me.emu.getStatusString());
                
                var viewObj = me.getView();
                
                memory.text(viewObj.text);
                
                if (viewObj.anchorLine) {
                    memory.scrollTop(viewObj.anchorLine * 19);
                }
            }, 100);
        } else if (!enable && interval) {
            window.clearInterval(interval);
            interval = null;
        }
    }
})();

/**
 * Get debugger view object.
 */
Debug.prototype.getView = function() {
    var viewObj;
    var pc = this.emu.tms9900.getPC();

    if (this.emu.isRunning()) {
        // Running
        if (this.memory_view == 0) {
            // Disassemble
            if (this.memory_type == 0) {
                // CPU
                this.disassembler.setMemory(this.emu.memory);
                viewObj = this.disassembler.disassemble(pc, null, 20, pc);
            } 
            else {
                // VDP
                this.disassembler.setMemory(this.emu.vdp);
                viewObj = this.disassembler.disassemble(this.debugger_address || 0, null, 20, pc);
            }
        }
        else {
            // Hex view
            if (this.memory_type == 0) {
                // CPU
                viewObj = this.emu.memory.hexView(this.debugger_address || 0x8300, 320, this.debugger_address);
            }
            else {
                // VDP
                viewObj = this.emu.vdp.hexView(this.debugger_address || 0, 320, this.debugger_address);
            }
        }
    }
    else {
        // Stopped
        if (this.memory_view == 0) {
            // Disassemble
            if (this.memory_type == 0) {
                // CPU
                this.disassembler.setMemory(this.emu.memory);
                viewObj = this.disassembler.disassemble(0, 0x10000, null, this.debugger_address || pc);
            }
            else {
                // VDP
                this.disassembler.setMemory(this.emu.vdp);
                viewObj = this.disassembler.disassemble(0, 0x4000, null, this.debugger_address || 0);
            }
        }
        else {
            // Hex view
            if (this.memory_type == 0) {
                // CPU
                viewObj = this.emu.memory.hexView(0, 0x10000, this.debugger_address || pc);
            }
            else {
                // VDP
                viewObj = this.emu.vdp.hexView(0, 0x4000, this.debugger_address || 0);
            }
        }
    }
    
    return viewObj;
}
