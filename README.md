![Logo](admin/homematic.png)
# ioBroker HomeMatic RPC Adapter
==================

[![NPM version](http://img.shields.io/npm/v/iobroker.hm-rpc.svg)](https://www.npmjs.com/package/iobroker.hm-rpc)
[![Downloads](https://img.shields.io/npm/dm/iobroker.hm-rpc.svg)](https://www.npmjs.com/package/iobroker.hm-rpc)

[![NPM](https://nodei.co/npm/iobroker.hm-rpc.png?downloads=true)](https://nodei.co/npm/iobroker.hm-rpc/)

Connects HomeMatic Interface-Processes (BidCos-Services, Homegear and CUxD) via XML-RPC or BIN-RPC to ioBroker

### Configuration

native.adapterAddress has to be the ip under which the host that is running the adapter itself is reachable.
This address is used by the CCU to connect to the adapter.

native.homematicAddress is the IP of the HomeMatic CCU respectively the Host that is running the BidCos-Service(s)

## Changelog

### 1.4.3 (2017-04-15)
* (bluefox) add Lock Value for KeyMatic

### 1.4.2 (2017-02-22)
* (bluefox) fixes small errors

### 1.4.1 (2017-01-18)
* (Apollon77) make it compatible with node 0.x again

### 1.4.0 (2017-01-16)
* (jens-maus) fixes/changes for listDevices/newDevices RPC calls for HmIP and CUxD variants of hm-rpc

### 1.3.5 (2017-01-15)
* (jens-maus) Fix notify of hm-rega to update names too on force-reload

### 1.3.4 (2017-01-15)
* (jens-maus) Update device images to latest CCU 2.25.15. Fix notify of hm-rega to update names too on force-reload  

### 1.3.3 (2016-10-08)
* (bluefox) Better connection indication

### 1.3.2 (2016-10-06)
* (bluefox) Very small changes for debug output

### 1.3.1 (2016-06-23)
* (bluefox) add new devices to meta info

### 1.2.1 (2016-06-21)
* (angelnu) add device icons

### 1.2.0 (2016-06-04)
* (bluefox) fix reconnection with binrpc

### 1.1.5 (2016-05-30)
* (bluefox) change connected status

### 1.1.3 (2016-04-19)
* (bluefox) try/catch by call of rpc methods.

### 1.1.2 (2016-04-11)
* (bluefox) fix XML send commands.

### 1.1.1 (2016-04-10)
* (bluefox) fix ports settings.
* (bluefox) add 2 images of devices

### 1.1.0 (2016-04-10)
* (bluefox) slow down creation of objects

### 1.0.5 (2016-04-05)
* (bluefox) do not show debug messages

### 1.0.4 (2016-03-22)
* (bluefox) xmlrpc rpoblem

### 1.0.3 (2016-03-22)
* (bluefox) fix settings of port in admin

### 1.0.2 (2016-03-20)
* (bluefox) change default driver port to same as homematic (old behavior)

### 1.0.1 (2016-03-20)
* (angelnu) add adapter port to configuration

### 1.0.0 (2016-03-02)
* (bluefox) add connection state

### 0.5.2 (2015-07-01)
* (bluefox) fix error if 2 hm-rpc adapters

### 0.5.1 (2015-06-28)
* (husky-koglhof) Add messagebox Function for ioBroker.occ
* (bluefox) update homematic-xmlrpc and binrpc versions

### 0.5.0 (2015-04-21)
* (tschombe) replace check init / virtual key handling with simple PING / PONG xml-rpc api calls
* (bluefox) fix deleteChannel

### 0.4.0 (2015-03-25)
* (bluefox) implement check init function

### 0.3.5 (2015-03-01)
* (bluefox) fix delete channels if they disappeared on CCU

### 0.3.4 (2015-02-27)
* (bluefox) delete devices if they disappeared on CCU
* (bluefox) add workingID for LEVEL

### 0.3.3 (2015-02-26)
* (bluefox) delete channels if they disappeared on CCU

### 0.3.2 (2015-02-13)
* (bluefox) fix error in 0.3.1, because of wrong packet

### 0.3.1 (2015-02-12)
* (bluefox) choose ioBroker address automatically
* (bluefox) fix error if bool controlled with "0"

### 0.3.0 (2015-01-16)
* (bluefox) fix error in xml-rpc. Works with homegear.

### 0.2.13 (2015-01-07)
* (bluefox) replace grad with °

### 0.2.12 (2015-01-06)
* (bluefox) catch errors if state deleted

### 0.2.11 (2015-01-03)
* (bluefox) fix small error

### 0.2.10 (2015-01-03)
* (bluefox) enable npm install

### 0.2.9 (2014-12-06)
* (bluefox) re-init of objects from config page

### 0.2.8 (2014-12-06)
* (bluefox) trigger update of hm-rega if list of devices updated

### 0.2.7 (2014-11-21)
* (bluefox) support of new naming concept with no parents and children

### 0.2.6 (2014-11-16)
* (bluefox) check data points without native attributes.

### 0.2.5 (2014-10-25)
* (bluefox) change state names to 'io.*'

### 0.2.4 (2014-10-22)
* (bluefox) fix error with invalid dpType

### 0.2.3 (2014-10-20)
* (bluefox) fix error in the event output

### 0.2.2 (2014-10-19)
* (bluefox) translate config

### 0.2.1
* (hobbyquaker) changed XML-RPC module source

### 0.2.0
* (hobbyquaker) added BIN-RPC support
* (hobbyquaker) added CUxD support
* (hobbyquaker) bugfixes

### 0.1.12
* (hobbyquaker) fixed error in package.json

### 0.1.11
* (hobbyquaker) fixed rpc event unit 100%

### 0.1.10
* (hobbyquaker) fixed rpc setValue type
* (hobbyquaker) fixed rpc setValue unit 100%

### 0.1.9
* (hobbyquaker) queue device/channel/datapoint creation - fixes missing children
* (hobbyquaker) added more role attributes (still many missing)

### 0.1.8
* (hobbyquaker) added more role attributes (still many missing)
* (hobbyquaker) fixes

### 0.1.7
* (hobbyquaker) renamed "ip" to "homematicAddress" and "port" to "homematicPort"
* (hobbyquaker) new config attribute "adapterAddress"
* (hobbyquaker) fixes
* (hobbyquaker) added more role attributes (still many missing)

### 0.1.6
* (hobbyquaker) config UI

### 0.1.5
* (hobbyquaker) added common.children

### 0.1.4
* (hobbyquaker) set connected state, prepared connection check

### 0.1.3
* (hobbyquaker) ship known meta.paramsetDescription
* (hobbyquaker) add meta.roles - table for channel/state common.role assignment

### 0.1.2

* (hobbyquaker) fix getValueParamset

### 0.1.1

* (hobbyquaker) prepare channel common.role

### 0.1.0

* (hobbyquaker) First Release

## Roadmap

* PING/PONG implementation when possible (CCU Firmware >= 2.9) - check via system.listMethods

## License

The MIT License (MIT)

Copyright (c) 2014-2017 bluefox, hobbyquaker

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
