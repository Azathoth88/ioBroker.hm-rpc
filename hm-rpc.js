/* jshint -W097 */// jshint strict:false
/*jslint node: true */
'use strict';
var utils = require(__dirname + '/lib/utils'); // Get common adapter utils

var connected = false;

// the adapter object
var adapter = utils.adapter({

    name: 'hm-rpc',

    ready: function () {
        adapter.subscribeStates('*');
        main();
    },
    stateChange: function (id, state) {
        if (state && state.ack !== true) {
            var tmp = id.split('.');
            var val;
            adapter.log.debug(adapter.config.type + 'rpc -> setValue ' + tmp[3] + ' ' + tmp[4] + ': ' + state.val);

            if (id == adapter.namespace + '.updated') return;
            if (!dpTypes[id]) {
                adapter.log.error(adapter.config.type + 'rpc -> setValue: no dpType for ' + id + '!');
                return;
            }

            if (dpTypes[id].UNIT === '100%') {
                state.val = state.val / 100;
            }

            var type = dpTypes[id].TYPE;

            switch (type) {
                case 'BOOL':
                    val = (state.val === 'false' || state.val === '0') ? false : !!state.val;
                    break;
                case 'FLOAT':
                    val = {explicitDouble: state.val};
                    break;
                default:
                    val = state.val;
            }

            adapter.log.info('setValue ' + JSON.stringify([tmp[2] + ':' + tmp[3], tmp[4], val]) + ' ' + type);

            try {
                if (rpcClient && connected) {
                    rpcClient.methodCall('setValue', [tmp[2] + ':' + tmp[3], tmp[4], val], function (err, data) {
                        if (err) {
                            adapter.log.error(adapter.config.type + 'rpc -> setValue ' + JSON.stringify([tmp[3], tmp[4], state.val]) + ' ' + type);
                            adapter.log.error(err);
                        }
                    });
                } else {
                    adapter.log.warn('Cannot setValue "' + id + '", because not connected.');
                }
            } catch (err) {
                adapter.log.error('Cannot call setValue: :' + err);
            }
        }
    },
    // Add messagebox Function for ioBroker.occ
    message: function (obj) {
        if (obj.message.params === undefined || obj.message.params === null) {
            try {
                if (rpcClient && connected) {
                    rpcClient.methodCall(obj.command, [obj.message.ID, obj.message.paramType], function (err, data) {
                        if (obj.callback) adapter.sendTo(obj.from, obj.command, {result: data, error: err}, obj.callback);
                    });
                } else {
                    adapter.log.warn('Cannot send "' + obj.command + '" "' + obj.message.ID + '": because not connected');
                    if (obj.callback) adapter.sendTo(obj.from, obj.command, {error: 'not connected'}, obj.callback);
                }
            } catch (err) {
                adapter.log.error('Cannot call ' + obj.command + ': ' + err);
                adapter.sendTo(obj.from, obj.command, {error: err}, obj.callback);
            }
        } else {
            try {
                if (rpcClient && connected) {
                    rpcClient.methodCall(obj.command, [obj.message.ID, obj.message.paramType, obj.message.params], function (err, data) {
                        if (obj.callback) adapter.sendTo(obj.from, obj.command, {
                            result: data,
                            error:  err
                        }, obj.callback);
                    });
                } else {
                    adapter.log.warn('Cannot send "' + obj.command + '" "' + obj.message.ID + '": because not connected');
                    if (obj.callback) adapter.sendTo(obj.from, obj.command, {error: 'not connected'}, obj.callback);
                }
            } catch (err) {
                adapter.log.error('Cannot call ' + obj.command + ': ' + err);
                adapter.sendTo(obj.from, obj.command, {error: err}, obj.callback);
            }
        }
    },
    unload: function (callback) {
        try {
            if (eventInterval) {
                clearInterval(eventInterval);
                eventInterval = null;
            }

            if (connInterval) {
                clearInterval(connInterval);
                connInterval = null;
            }
            if (connTimeout) {
                clearTimeout(connTimeout);
                connTimeout = null;
            }

            if (adapter.config && rpcClient) {
                adapter.log.info(adapter.config.type + 'rpc -> ' + adapter.config.homematicAddress + ':' + adapter.config.homematicPort + ' init ' + JSON.stringify([daemonURL, '']));
                try {
                    rpcClient.methodCall('init', [daemonURL, ''], function (err, data) {
                        if (connected) {
                            adapter.log.info('Disconnected');
                            connected = false;
                            adapter.setState('info.connection', false, true);
                        }
                        if (callback) callback();
                        callback = null;
                    });
                } catch (err) {
                    if (connected) {
                        adapter.log.info('Disconnected');
                        connected = false;
                        adapter.setState('info.connection', false, true);
                    }
                    adapter.log.error('Cannot call init: [' + daemonURL + ', ""]' + err);
                    if (callback) callback();
                    callback = null;
                }

            } else {
                if (callback) callback();
                callback = null;
            }
        } catch (e) {
            if (adapter && adapter.log) {
                adapter.log.error('Unload error: ' + e);
            } else {
                console.log(e);
            }
            if (callback) callback();
            callback = null;
        }
    }
});

var rpc;
var rpcClient;

var rpcServer;

var metaValues =    {};
var metaRoles =     {};
var dpTypes =       {};

var lastEvent = 0;
var eventInterval;
var connInterval;
var connTimeout;
var daemonURL = '';
var daemonProto = '';

var images =  {
    'HM-LC-Dim1TPBU-FM': 'PushButton-2ch-wm_thumb.png',
    'HM-LC-Sw1PBU-FM':   'PushButton-2ch-wm_thumb.png',
    'HM-LC-Bl1PBU-FM':   'PushButton-2ch-wm_thumb.png',
    'HM-LC-Sw1-PB-FM':   'PushButton-2ch-wm_thumb.png',
    'HM-PB-2-WM':        'PushButton-2ch-wm_thumb.png',
    'HM-LC-Sw2-PB-FM':   'PushButton-4ch-wm_thumb.png',
    'HM-PB-4-WM':        'PushButton-4ch-wm_thumb.png',
    'HM-LC-Dim1L-Pl':    'OM55_DimmerSwitch_thumb.png',
    'HM-LC-Dim1T-Pl':    'OM55_DimmerSwitch_thumb.png',
    'HM-LC-Sw1-Pl':      'OM55_DimmerSwitch_thumb.png',
    'HM-LC-Dim1L-Pl-2':  'OM55_DimmerSwitch_thumb.png',
    'HM-LC-Sw1-Pl-OM54': 'OM55_DimmerSwitch_thumb.png',
    'HM-Sys-sRP-Pl':     'OM55_DimmerSwitch_thumb.png',
    'HM-LC-Dim1T-Pl-2':  'OM55_DimmerSwitch_thumb.png',
    'HM-LC-Sw1-Pl-2':    'OM55_DimmerSwitch_thumb.png',
    'HM-ES-PMSw1-SM':    '115_hm-es-pmsw1-sm_thumb.png',
    'HM-LC-Dim1T-FM-LF': '114_hm-lc-dim1t-fm-lf_thumb_3.png',
    //'xxx':             '114_hm-lc-dim1t-fm-lf_thumb_2.png',
    //'xxx':             '114_hm-lc-dim1t-fm-lf_thumb.png',
    //'xxx':             '113_hmip-psm_thumb.png',
    //'xxx':             '112_hmip-wrc2_thumb.png',
    'HM-LC-RGBW-WM':     '111_hm-lc-rgbw-wm_thumb.png',
    'HM-ES-PMSw1-DR':    '110_hm-es-pmsw1-dr_thump.png',
    'HM-LC-Sw1-Pl-CT-R1':'109_hm-lc-sw1-pl-ct_thump.png',
    'HM-RC-Dis-H-x-EU':  '108_hm-rc-dis-h-x-eu_thump.png',
    'HM-ES-PMSw1-Pl-DN-R5': '107_hm-es-pmsw1-pl-R5_thumb.png',
    'HM-ES-PMSw1-Pl-DN-R4': '107_hm-es-pmsw1-pl-R4_thumb.png',
    'HM-ES-PMSw1-Pl-DN-R3': '107_hm-es-pmsw1-pl-R3_thumb.png',
    'HM-ES-PMSw1-Pl-DN-R2': '107_hm-es-pmsw1-pl-R2_thumb.png',
    'HM-Sec-SD-2-Team':  '105_hm-sec-sd-2-team_thumb.png',
    'HM-Sec-SD-2':       '104_hm-sec-sd-2_thumb.png',
    'HM-Sen-MDIR-WM55':  '103_hm-sen-mdir-wm55_thumb.png',
    'HM-ES-TX-WM':       '102_hm-es-tx-wm_thumb.png',
    'HM-Sen-DB-PCB':     '101_hm-sen-db-pcb_thumb.png',
    'HM-RC-8':           '100_hm-rc-8_thumb.png',
    'HM-MOD-EM-8':       '99_hm-mod-em-8_thumb.png',
    'HM-Sec-SCo':        '98_hm-sec-sco_thumb.png',
    'HM-Dis-WM55':       '97_hm-dis-wm55_thumb.png',
    'HM-TC-IT-WM-W-EU':  '96_hm-tc-it-wm-w-eu_thumb.png',
    'HM-CC-VG-1':        '95_group_hm-cc-vg-1_thumb.png',
    'HM-MOD-Re-8':       '94_hm-mod-re-8_thumb.png',
    'HM-ES-PMSw1-Pl':    '93_hm-es-pmsw1-pl_thumb.png',
    'HM-OU-CM-PCB':      '92_hm-ou-cm-pcb_thumb.png',
    'HM-LC-Sw4-Ba-PCB':  '88_hm-lc-sw4-ba-pcb_thumb.png',
    'HM-Sen-RD-O':       '87_hm-sen-rd-o_thumb.png',
    'HM-RC-Sec4-2':      '86_hm-rc-sec4-2_thumb.png',
    'HM-PB-6-WM55':      '86_hm-pb-6-wm55_thumb.png',
    'HM-RC-Key4-2':      '85_hm-rc-key4-2_thumb.png',
    'HM-RC-Key4-3':      '84_hm-rc-4-x_thumb.png',
    'HM-RC-4-2':         '84_hm-rc-4-2_thumb.png',
    'HM-CC-RT-DN':       '83_hm-cc-rt-dn_thumb.png',
    'HM-Sen-Wa-Od':      '82_hm-sen-wa-od_thumb.png',
    'HM-Sen-WA-OD':      '82_hm-sen-wa-od_thumb.png',
    'HM-Dis-TD-T':       '81_hm-dis-td-t_thumb.png',
    'HM-Sen-MDIR-O':     '80_hm-sen-mdir-o_thumb.png',
    'HM-OU-LED16':       '78_hm-ou-led16_thumb.png',
    'HM-LC-Sw1-Ba-PCB':  '77_hm-lc-sw1-ba-pcb_thumb.png',
    'HM-LC-Sw4-WM':      '76_hm-lc-sw4-wm_thumb.png',
    'HM-PB-2-WM55':      '75_hm-pb-2-wm55_thumb.png',
    'atent':             '73_hm-atent_thumb.png',
    'HM-RC-BRC-H':       '72_hm-rc-brc-h_thumb.png',
    'HMW-IO-12-Sw14-DR': '71_hmw-io-12-sw14-dr_thumb.png',
    'HM-PB-4Dis-WM':     '70_hm-pb-4dis-wm_thumb.png',
    'HM-LC-Sw2-DR':      '69_hm-lc-sw2-dr_thumb.png',
    'HM-LC-Sw4-DR':      '68_hm-lc-sw4-dr_thumb.png',
    'HM-SCI-3-FM':       '67_hm-sci-3-fm_thumb.png',
    'HM-LC-Dim1T-CV':    '66_hm-lc-dim1t-cv_thumb.png',
    'HM-LC-Dim1T-FM':    '65_hm-lc-dim1t-fm_thumb.png',
    'HM-LC-Dim2T-SM':    '64_hm-lc-dim2T-sm_thumb.png',
    'HM-LC-Bl1-pb-FM':   '61_hm-lc-bl1-pb-fm_thumb.png',
    'HM-LC-Bi1-pb-FM':   '61_hm-lc-bi1-pb-fm_thumb.png',
    'HM-OU-CF-Pl':       '60_hm-ou-cf-pl_thumb.png',
    'HM-OU-CFM-Pl':      '60_hm-ou-cf-pl_thumb.png',
    'HMW-IO-12-FM':      '59_hmw-io-12-fm_thumb.png',
    'HMW-Sen-SC-12-FM':  '58_hmw-sen-sc-12-fm_thumb.png',
    'HM-CC-SCD':         '57_hm-cc-scd_thumb.png',
    'HMW-Sen-SC-12-DR':  '56_hmw-sen-sc-12-dr_thumb.png',
    'HM-Sec-SFA-SM':     '55_hm-sec-sfa-sm_thumb.png',
    'HM-LC-ddc1':        '54a_lc-ddc1_thumb.png',
    'HM-LC-ddc1-PCB':    '54_hm-lc-ddc1-pcb_thumb.png',
    'HM-Sen-MDIR-SM':    '53_hm-sen-mdir-sm_thumb.png',
    'HM-Sec-SD-Team':    '52_hm-sec-sd-team_thumb.png',
    'HM-Sec-SD':         '51_hm-sec-sd_thumb.png',
    'HM-Sec-MDIR':       '50_hm-sec-mdir_thumb.png',
    'HM-Sec-WDS':        '49_hm-sec-wds_thumb.png',
    'HM-Sen-EP':         '48_hm-sen-ep_thumb.png',
    'HM-Sec-TiS':        '47_hm-sec-tis_thumb.png',
    'HM-LC-Sw4-PCB':     '46_hm-lc-sw4-pcb_thumb.png',
    'HM-LC-Dim2L-SM':    '45_hm-lc-dim2l-sm_thumb.png',
    'HM-EM-CCM':         '44_hm-em-ccm_thumb.png',
    'HM-CC-VD':          '43_hm-cc-vd_thumb.png',
    'HM-CC-TC':          '42_hm-cc-tc_thumb.png',
    'HM-Swi-3-FM':       '39_hm-swi-3-fm_thumb.png',
    'HM-PBI-4-FM':       '38_hm-pbi-4-fm_thumb.png',
    'HMW-Sys-PS7-DR':    '36_hmw-sys-ps7-dr_thumb.png',
    'HMW-Sys-TM-DR':     '35_hmw-sys-tm-dr_thumb.png',
    'HMW-Sys-TM':        '34_hmw-sys-tm_thumb.png',
    'HMW-Sec-TR-FM':     '33_hmw-sec-tr-fm_thumb.png',
    'HMW-WSTH-SM':       '32_hmw-wsth-sm_thumb.png',
    'HMW-WSE-SM':        '31_hmw-wse-sm_thumb.png',
    'HMW-IO-12-Sw7-DR':  '30_hmw-io-12-sw7-dr_thumb.png',
    'HMW-IO-4-FM':       '29_hmw-io-4-fm_thumb.png',
    'HMW-LC-Dim1L-DR':   '28_hmw-lc-dim1l-dr_thumb.png',
    'HMW-LC-Bl1-DR':     '27_hmw-lc-bl1-dr_thumb.png',
    'HMW-LC-Sw2-DR':     '26_hmw-lc-sw2-dr_thumb.png',
    'HM-EM-CMM':         '25_hm-em-cmm_thumb.png',
    'HM-CCU-1':          '24_hm-cen-3-1_thumb.png',
    'HM-RCV-50':         '24_hm-cen-3-1_thumb.png',
    'HMW-RCV-50':        '24_hm-cen-3-1_thumb.png',
    'HM-RC-Key3':        '23_hm-rc-key3-b_thumb.png',
    'HM-RC-Key3-B':      '23_hm-rc-key3-b_thumb.png',
    'HM-RC-Sec3':        '22_hm-rc-sec3-b_thumb.png',
    'HM-RC-Sec3-B':      '22_hm-rc-sec3-b_thumb.png',
    'HM-RC-P1':          '21_hm-rc-p1_thumb.png',
    'HM-RC-19':          '20_hm-rc-19_thumb.png',
    'HM-RC-19-B':        '20_hm-rc-19_thumb.png',
    'HM-RC-19-SW':       '20_hm-rc-19_thumb.png',
    'HM-RC-12':          '19_hm-rc-12_thumb.png',
    'HM-RC-12-B':        '19_hm-rc-12_thumb.png',
    'HM-RC-4':           '18_hm-rc-4_thumb.png',
    'HM-RC-4-B':         '18_hm-rc-4_thumb.png',
    'HM-Sec-RHS':        '17_hm-sec-rhs_thumb.png',
    'HM-Sec-SC':         '16_hm-sec-sc_thumb.png',
    'HM-Sec-SC-2':       '16_hm-sec-sc_thumb.png',
    'HM-Sec-Win':        '15_hm-sec-win_thumb.png',
    'HM-Sec-Key':        '14_hm-sec-key_thumb.png',
    'HM-Sec-Key-S':      '14_hm-sec-key_thumb.png',
    'HM-WS550STH-I':     '13_hm-ws550sth-i_thumb.png',
    'HM-WDS40-TH-I':     '13_hm-ws550sth-i_thumb.png',
    'HM-WS550-US':       '9_hm-ws550-us_thumb.png',
    'WS550':             '9_hm-ws550-us_thumb.png',
    'HM-WDC7000':        '9_hm-ws550-us_thumb.png',
    'HM-LC-Sw1-SM':      '8_hm-lc-sw1-sm_thumb.png',
    'HM-LC-Bl1-FM':      '7_hm-lc-bl1-fm_thumb.png',
    'HM-LC-Bl1-SM':      '6_hm-lc-bl1-sm_thumb.png',
    'HM-LC-Sw2-FM':      '5_hm-lc-sw2-fm_thumb.png',
    'HM-LC-Sw1-FM':      '4_hm-lc-sw1-fm_thumb.png',
    'HM-LC-Sw4-SM':      '3_hm-lc-sw4-sm_thumb.png',
    'HM-LC-Dim1L-CV':    '2_hm-lc-dim1l-cv_thumb.png',
    'HM-LC-Dim1PWM-CV':  '2_hm-lc-dim1l-cv_thumb.png',
    'HM-WS550ST-IO':     'IP65_G201_thumb.png',
    'HM-WDS30-T-O':      'IP65_G201_thumb.png',
    'HM-WDS100-C6-O':    'WeatherCombiSensor_thumb.png',
    'HM-WDS10-TH-O':     'TH_CS_thumb.png',
    'HM-WS550STH-O':     'TH_CS_thumb.png',
    'HM-WDS30-OT2-SM':   'IP65_G201_thumb.png'
};

function main() {
    adapter.config.reconnectInterval = parseInt(adapter.config.reconnectInterval, 10) || 30;
    if (adapter.config.reconnectInterval < 10) {
        adapter.log.error('Reconnect interval is less than 10 seconds. Set reconnect interval to 10 seconds.');
        adapter.config.reconnectInterval = 10;
    }

    adapter.config.checkInitInterval = parseInt(adapter.config.checkInitInterval, 10);
    if (adapter.config.checkInitInterval < 10) {
        adapter.log.error('Check init interval is less than 10 seconds. Set init interval to 10 seconds.');
        adapter.config.checkInitInterval = 10;
    }

    if (adapter.config.type === 'bin') {
        rpc = require('binrpc');
        daemonProto = 'xmlrpc_bin://';
    } else {
        rpc = require('homematic-xmlrpc');
        adapter.config.type = 'xml';
        daemonProto = 'http://';
    }

    // Load VALUE paramsetDescriptions (needed to create state objects)
    adapter.objects.getObjectView('hm-rpc', 'paramsetDescription', {startkey: 'hm-rpc.meta.VALUES', endkey: 'hm-rpc.meta.VALUES.\u9999'}, function handleValueParamSetDescriptions(err, doc) {
        if (err) adapter.log.error('getObjectView hm-rpc: ' + err)
        if (doc) {
            for (var i = 0; i < doc.rows.length; i++) {
                metaValues[doc.rows[i].id.slice(19)] = doc.rows[i].value.native;
            }
        }
        // Load common.role assignments
        adapter.objects.getObject('hm-rpc.meta.roles', function (err, res) {
            if (err) adapter.log.error('hm-rpc.meta.roles: ' + err)
            if (res) metaRoles = res.native;

            // Start Adapter
            if (adapter.config) initRpcServer();
        });
    });

    adapter.objects.getObjectView('system', 'state', {startkey: adapter.namespace, endkey: adapter.namespace + '\u9999'}, function handleStateViews(err, res) {
        if (!err && res.rows) {
            for (var i = 0; i < res.rows.length; i++) {
                if (res.rows[i].id == adapter.namespace + '.updated') continue;
                if (!res.rows[i].value.native) {
                    adapter.log.warn('State ' + res.rows[i].id + ' does not have native.');
                    dpTypes[res.rows[i].id] = {UNIT: '', TYPE: ''};
                } else {
                    dpTypes[res.rows[i].id] = {UNIT: res.rows[i].value.native.UNIT, TYPE: res.rows[i].value.native.TYPE};
                }
            }
        }
    });
}

function sendInit() {
    try {
        if (rpcClient && (rpcClient.connected === undefined || rpcClient.connected)) {
            adapter.log.debug(adapter.config.type + 'rpc -> ' + adapter.config.homematicAddress + ':' + adapter.config.homematicPort + ' init ' + JSON.stringify([daemonURL, adapter.namespace]));
            rpcClient.methodCall('init', [daemonURL, adapter.namespace], function handleInit(err, data) {
                if (!err) {
                    if (adapter.config.daemon === 'CUxD') {
                        getCuxDevices(function handleCuxDevices(err2) {
                            if (!err2) {
                                updateConnection();
                            } else {
                                adapter.log.error('getCuxDevices error: ' + err2);
                            }
                        });
                    } else {
                        updateConnection();
                    }
                } else {
                    adapter.log.error('init error: ' + err);
                }
            });
        }
    } catch (err) {
        adapter.log.error('Init not possible, going to stop: ', err);
        adapter.stop();
    }
}

function sendPing() {
    if (rpcClient) {
        adapter.log.debug('Send PING...');
        try {
            rpcClient.methodCall('ping', [adapter.namespace], function (err, data) {
                if (!err) {
                    adapter.log.debug('PING ok');
                } else {
                    adapter.log.error('Ping error: ' + err);
                    if (connected) {
                        adapter.log.info('Disconnected');
                        connected = false;
                        adapter.setState('info.connection', false, true);
                        connect();
                    }
                }
            });
        } catch (err) {
            adapter.log.error('Cannot call ping [' + adapter.namespace + ']: ' + err);
        }
    } else {
        adapter.warn('Called PING, but client does not exist');
        if (connected) {
            adapter.log.info('Disconnected');
            connected = false;
            adapter.setState('info.connection', false, true);
            connect();
        }
    }
}

function initRpcServer() {
    adapter.config.homematicPort = parseInt(adapter.config.homematicPort, 10);
    adapter.config.port          = parseInt(adapter.config.port, 10);

    //adapterPort was introduced in v1.0.1. If not set yet then try 2000
    var adapterPort = parseInt(adapter.config.port || adapter.config.homematicPort, 10) || 2000;
    adapter.getPort(adapterPort, function (port) {
        daemonURL = daemonProto + adapter.config.adapterAddress + ':' + port;
        rpcServer = rpc.createServer({host: adapter.config.adapterAddress, port: port});

        adapter.log.info(adapter.config.type + 'rpc server is trying to listen on ' + adapter.config.adapterAddress + ':' + port);
        adapter.log.info(adapter.config.type + 'rpc client is trying to connect to ' + adapter.config.homematicAddress + ':' + adapter.config.homematicPort + ' with ' + JSON.stringify([daemonURL, adapter.namespace]));

        connect(true);

        rpcServer.on('NotFound', function (method, params) {
            adapter.log.warn(adapter.config.type + 'rpc <- undefined method ' + method + ' ' + JSON.stringify(params).slice(0, 80));
        });

        rpcServer.on('system.multicall', function (method, params, callback) {
            updateConnection();
            var response = [];
            for (var i = 0; i < params[0].length; i++) {
                if (methods[params[0][i].methodName]) {
                    adapter.log.debug(adapter.config.type + ' multicall <' + params[0][i].methodName + '>: ' + params[0][i].params);
                    response.push(methods[params[0][i].methodName](null, params[0][i].params));
                } else {
                    response.push('');
                }
            }
            callback(null, response);
        });

        rpcServer.on('system.listMethods', function (err, params, callback) {
            adapter.log.info(adapter.config.type + 'rpc <- system.listMethods ' + JSON.stringify(params));
            callback(null, ['event', 'deleteDevices', 'listDevices', 'newDevices', 'system.listMethods', 'system.multicall']);
        });

        rpcServer.on('event', function (err, params, callback) {
            updateConnection();
            try {
                callback(null, methods.event(err, params));
            } catch (err) {
                adapter.log.error('Cannot response on event:' + err);
            }
        });

        rpcServer.on('newDevices', function (err, params, callback) {
            adapter.log.info(adapter.config.type + 'rpc <- newDevices ' + params[1].length);
            createDevices(params[1], callback);
        });

        rpcServer.on('listDevices', function (err, params, callback) {
            adapter.log.info(adapter.config.type + 'rpc <- listDevices ' + JSON.stringify(params));
            adapter.objects.getObjectView('hm-rpc', 'listDevices', {startkey: 'hm-rpc.' + adapter.instance + '.', endkey: 'hm-rpc.' + adapter.instance + '.\u9999'}, function (err, doc) {
                var response = [];
                if (!adapter.config.forceReInit) {
                    for (var i = 0; i < doc.rows.length; i++) {
                        if (doc.rows[i].id == adapter.namespace + '.updated') continue;
                        var val = doc.rows[i].value;

                        /*if (val.PARENT_TYPE) {
                         channelParams[val.ADDRESS] = val.PARENT_TYPE + '.' + val.TYPE + '.' + val.VERSION;
                         }*/
                        if (val.ADDRESS) response.push({ADDRESS: val.ADDRESS, VERSION: val.VERSION});
                    }
                }
                adapter.log.info(adapter.config.type + 'rpc -> ' + response.length + ' devices');
                //log.info(JSON.stringify(response));
                try {
                    for (var r = response.length - 1; r >= 0; r--) {
                        if (!response[r].ADDRESS) {
                            adapter.log.warn(adapter.config.type + 'rpc -> found empty entry at position ' + r + ' !');
                            response.splice(r, 1);
                        }
                    }

                    callback(null, response);
                } catch (err) {
                    adapter.log.error('Cannot response on listDevices:' + err);
                    require('fs').writeFileSync(__dirname + '/problem.json', JSON.stringify(response));
                }
            });
        });

        rpcServer.on('deleteDevices', function (err, params, callback) {
            adapter.log.info(adapter.config.type + 'rpc <- deleteDevices ' + params[1].length);
            for (var i = 0; i < params[1].length; i++) {
                if (params[1][i].indexOf(':') != -1) {
                    params[1][i] = params[1][i].replace(':', '.');
                    adapter.log.info('channel ' + params[1][i] + ' ' + JSON.stringify(params[1][i]) + ' deleted');
                    var parts = params[1][i].split('.');
                    adapter.deleteChannel(parts[parts.length - 2], parts[parts.length - 1]);
                } else {
                    adapter.log.info('device ' + params[1][i] + ' deleted');
                    adapter.deleteDevice(params[1][i]);
                }
            }
            try {
                callback(null, '');
            } catch (err) {
                adapter.log.error('Cannot response on deleteDevices:' + err);
            }
        });
    });
}

var methods = {

    event: function (err, params) {
        adapter.log.debug(adapter.config.type + 'rpc <- event ' + JSON.stringify(params));
        var val;
        var channel = params[1].replace(':', '.');
        var name = params[0] + '.' + channel + '.' + params[2];

        if (dpTypes[name] && dpTypes[name].UNIT === '100%') {
            val = (params[3] * 100);
        } else {
            val = params[3];
        }

        adapter.setState(channel + '.' + params[2], {val: val, ack: true});
        return '';
    }

};

var queueValueParamsets = [];

function addParamsetObjects(channel, paramset, callback) {
    var channelChildren = [];
    var count = 0;
    for (var key in paramset) {
        channelChildren.push(channel._id + '.' + key);
        var commonType = {
            'ACTION':  'boolean',
            'BOOL':    'boolean',
            'FLOAT':   'number',
            'ENUM':    'number',
            'INTEGER': 'number',
            'STRING':  'string'
        };

        var obj = {
            type:   'state',
            common: {
                def:   paramset[key].DEFAULT,
                type:  commonType[paramset[key].TYPE] || paramset[key].TYPE || '',
                read:  (paramset[key].OPERATIONS & 1 ? true : false),
                write: (paramset[key].OPERATIONS & 2 ? true : false)
            },
            native: paramset[key]
        };

        if (obj.common.type === 'number') {
            var i;
            obj.common.min = paramset[key].MIN;
            obj.common.max = paramset[key].MAX;

            if (paramset[key].TYPE === 'ENUM') {
                obj.common.states = {};
                for (i = 0; i < paramset[key].VALUE_LIST.length; i++) {
                    obj.common.states[i] = paramset[key].VALUE_LIST[i];
                }
            }

            if (paramset[key].SPECIAL) {
                if (!obj.common.states) obj.common.states = {};
                for (i = 0; i < paramset[key].SPECIAL.length; i++) {
                    obj.common.states[paramset[key].SPECIAL[i].VALUE] = paramset[key].SPECIAL[i].ID;
                }
            }
        }

        if (paramset[key].UNIT === '100%') {
            obj.common.unit = '%';
            obj.common.max = 100 * paramset[key].MAX;
        } else if (paramset[key].UNIT !== '') {
            obj.common.unit = paramset[key].UNIT;
            if (obj.common.unit == '�C' || obj.common.unit == '&#176;C') {
                obj.common.unit = '°C';
            } else if (obj.common.unit == '�F' || obj.common.unit == '&#176;F') {
                obj.common.unit = '°F';
            }
        }

        if (metaRoles.dpCONTROL && metaRoles.dpCONTROL[obj.native.CONTROL]) {
            obj.common.role = metaRoles.dpCONTROL[obj.native.CONTROL];

        } else if (metaRoles.chTYPE_dpNAME && metaRoles.chTYPE_dpNAME[channel.native.TYPE + '.' + key]) {
            obj.common.role = metaRoles.chTYPE_dpNAME[channel.native.TYPE + '.' + key];

        } else if (metaRoles.dpNAME && metaRoles.dpNAME[key]) {
            obj.common.role =  metaRoles.dpNAME[key];
        }

        if (paramset[key].OPERATIONS & 8) {
            obj.common.role = 'indicator.service';
        }

        if (typeof obj.common.role !== 'string' && typeof obj.common.role !== 'undefined') {
            throw 'typeof obj.common.role ' + typeof obj.common.role;
        }
        dpTypes[adapter.namespace + '.' + channel._id + '.' + key] = {UNIT: paramset[key].UNIT, TYPE: paramset[key].TYPE};
        if (key == 'LEVEL' && paramset.WORKING) {
            obj.common.workingID = 'WORKING';
        }
        count++;
        adapter.extendObject(channel._id + '.' + key, obj, function (err, res) {
            if (!err) {
                adapter.log.debug('object ' + res.id + ' extended');
            } else {
                adapter.log.error('object ' + (res ? res.id : '?') + ' extend ' + err);
            }

            if (!--count) callback();
        });
    }
    if (!count) callback();
}

function getValueParamsets() {
    if (queueValueParamsets.length === 0) {
        // Inform hm-rega about new devices
        adapter.setState('updated', true, true);
        // Inform hm-rega about new devices
        if (adapter.config.forceReInit) {
            adapter.extendForeignObject('system.adapter.' + adapter.namespace, {native: {forceReInit: false}});
        }
        return;
    }
    var obj = queueValueParamsets.pop();
    var cid = obj.native.PARENT_TYPE + '.' + obj.native.TYPE + '.' + obj.native.VERSION;

    adapter.log.debug('getValueParamsets ' + cid);

    if (metaValues[cid]) {

        adapter.log.debug('paramset cache hit');
        addParamsetObjects(obj, metaValues[cid], function () {
            setTimeout(getValueParamsets, 0);
        });

    } else {

        var key = 'hm-rpc.meta.VALUES.' + cid;
        adapter.objects.getObject(key, function (err, res) {

            if (res && res.native) {
                adapter.log.debug(key + ' found');
                metaValues[cid] = res.native;
                addParamsetObjects(obj, res.native, function () {
                    setTimeout(getValueParamsets, 0);
                });
            } else {
                adapter.log.info(adapter.config.type + 'rpc -> getParamsetDescription ' + JSON.stringify([obj.native.ADDRESS, 'VALUES']));
                try {
                    rpcClient.methodCall('getParamsetDescription', [obj.native.ADDRESS, 'VALUES'], function (err, res) {
                        var paramset = {
                            'type': 'meta',
                            'meta': {
                                adapter: 'hm-rpc',
                                type: 'paramsetDescription'
                            },
                            'common': {

                            },
                            'native': res
                        };
                        metaValues[key] = res;
                        adapter.log.info('Send this info to developer: setObject ' + key);
                        adapter.log.warn('Send this info to developer: ' + JSON.stringify(paramset));
                        adapter.objects.setObject(key, paramset, function () {
                            addParamsetObjects(obj, res, function () {
                                setTimeout(getValueParamsets, 0);
                            });
                        });
                    });
                } catch (err) {
                    adapter.log.error('Cannot call getParamsetDescription: :' + err);
                }
            }

        });
    }
}

function createDevices(deviceArr, callback) {
    var objs = [];

    for (var i = 0; i < deviceArr.length; i++) {
        var type;
        var role;
        var icon;

        if (deviceArr[i].PARENT) {
            type = 'channel';
            role = metaRoles.chTYPE && metaRoles.chTYPE[deviceArr[i].TYPE] ? metaRoles.chTYPE && metaRoles.chTYPE[deviceArr[i].TYPE] : undefined;
        } else {
            type = 'device';
            if (!images[deviceArr[i].TYPE]) {
                adapter.log.warn('No image for "' + deviceArr[i].TYPE + '" found.');
            }

            icon = images[deviceArr[i].TYPE] ? ('/icons/' + images[deviceArr[i].TYPE]) : '';
        }

        var obj = {
            _id: deviceArr[i].ADDRESS.replace(':', '.'),
            type: type,
            common: {
                // FIXME strange bug - LEVEL and WORKING datapoint of Dimmers have name of first dimmer device?!?
                name: deviceArr[i].ADDRESS,
                role: role
            },
            native: deviceArr[i]
        };

        if (icon) obj.common.icon = icon;

        dpTypes[adapter.namespace + '.' + obj._id] = {UNIT: deviceArr[i].UNIT, TYPE: deviceArr[i].TYPE};
        objs.push(obj);
    }

    function queue() {
        if (objs.length) {

            var obj = objs.pop();
            adapter.setObject(obj._id, obj, function (err, res) {
                if (!err) {
                    adapter.log.debug('object ' + res.id + ' created');
                } else {
                    adapter.log.error('object ' + (res ? res.id : '?') + ' error on creation: ' + err);
                }
                setTimeout(queue, 0);
            });

            if (obj.type === 'channel') {
                var cid = obj.PARENT_TYPE + '.' + obj.TYPE + '.' + obj.VERSION;
                //channelParams[obj._id] = cid;
                if (!metaValues[cid]) {
                    queueValueParamsets.push(obj);
                }
            }

        } else {
            getValueParamsets();
            callback(null, '');
        }
    }

    queue();
}

function getCuxDevices(callback) {
    // Todo read existing devices from couchdb and put IDs in array
    // var devices = [];

    if (rpcClient) {
        // request devices from CUxD
        try {
            rpcClient.methodCall('listDevices', [], function (err, data) {
                adapter.log.info(adapter.config.type + 'rpc -> listDevices ' + data.length);
                // Todo remove device ids from array
                createDevices(data, callback);
            });
        } catch (err) {
            adapter.log.error('Cannot call listDevices: ' + err);
        }
    } else {
        callback && callback();
    }

    // Todo delete all in array remaining devices
}

function updateConnection() {
    lastEvent = (new Date()).getTime();

    if (!connected) {
        adapter.log.info('Connected');
        connected = true;
        adapter.setState('info.connection', true, true);
    }

    if (connInterval) {
        adapter.log.debug('clear connecting interval');
        clearInterval(connInterval);
        connInterval = null;
    }
    if (connTimeout) {
        adapter.log.debug('clear connecting timeout');
        clearTimeout(connTimeout);
        connTimeout = null;
    }
    if (!eventInterval) {
        adapter.log.debug('start ping interval');
        eventInterval = setInterval(keepAlive, adapter.config.checkInitInterval * 1000 / 2);
    }
}

function connect(isFirst) {
    if (!rpcClient) {
        rpcClient = rpc.createClient({
            host: adapter.config.homematicAddress,
            port: adapter.config.homematicPort,
            path: '/'
        });

        // if bin-rpc
        if (rpcClient.on) {
            rpcClient.on('connect', function (err) {
                sendInit();
            });

            rpcClient.on('error', function (err) {
                adapter.log.error('Socket error: ' + err);
            });

            rpcClient.on('close', function () {
                adapter.log.debug('Socket closed.');
                if (connected) {
                    adapter.log.info('Disconnected');
                    connected = false;
                    adapter.setState('info.connection', false, true);
                }

                if (eventInterval) {
                    adapter.log.debug('clear ping interval');
                    clearInterval(eventInterval);
                    eventInterval = null;
                }
                // clear queue
                if (rpcClient.queue) {
                    while (rpcClient.queue.length) {
                        rpcClient.queue.pop();
                    }
                    rpcClient.pending = false;
                }

                if (!connTimeout) {
                    connTimeout = setTimeout(connect, adapter.config.reconnectInterval * 1000);
                }
            });
        }
    }

    connTimeout = null;
    adapter.log.debug('Connect...');
    if (eventInterval) {
        adapter.log.debug('clear ping interval');
        clearInterval(eventInterval);
        eventInterval = null;
    }

    // if bin rpc
    if (rpcClient.connect) {
        if (!isFirst) rpcClient.connect();
    } else {
        if (isFirst) sendInit();

        if (!connInterval) {
            adapter.log.debug('start connecting interval');
            connInterval = setInterval(function () {
                sendInit();
            }, adapter.config.reconnectInterval * 1000);
        }
    }
}

function keepAlive() {
    if (connInterval) {
        clearInterval(connInterval);
        connInterval = null;
    }

    var _now = (new Date()).getTime();
    // Check last event time. If timeout => send init again
    if (!lastEvent || (_now - lastEvent) >= adapter.config.checkInitInterval * 1000) {
        connect();
    } else {
        // Send every half interval ping to CCU
        sendPing();
    }
}