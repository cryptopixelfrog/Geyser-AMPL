#!/usr/bin/python

# https://www.poftut.com/how-to-install-pip-on-macos/
#$ pwd
#scripts/abi
#python get_abi.py -a 0x52Ac45C123D9A506dcd483e6Ef1EfFA497F2BD20 -o xAAVEa.abi


import requests
import random
import json
import sys, getopt


class ContractPreProcess(object):

    def __init__(self):
        self.abiPoint = 'https://api.etherscan.io/api?module=contract&action=getabi&address='
        self.filepath = './'

    def send_request(self, contractAddr):
        requestUrl = self.abiPoint + contractAddr
        headers = {'content-type': 'application/json'}
        payload = {'jsonrpc': '2.0'}
        response = None

        while not response:
            try:
                response = requests.post(requestUrl, data=json.dumps(payload), headers=headers).json()
            except requests.exceptions.ConnectionError as e:
                pass

        try:
            #self.validate_abi(response[u'result'])
            return response[u'result']
        except KeyError:
            print('No result found')
            raise Exception('No result returned')



    def validate_abi(self, jsonObj):
        print(jsonObj)
        print(jsonObj.find('balanceOf'))
        if jsonObj.find('balanceOf') < 0:
            raise Exception('No balanceOf found, please validate token abi.')
            sys.exit()



    def save_json(self, jsonObj, outputName):
        abi_json = json.loads(jsonObj)
        result = json.dumps(abi_json, indent=4, sort_keys=True)
        open(self.filepath + outputName, 'w').write(result)






if __name__ == '__main__':

    contractAddr = ''
    outputName = ''
    argv = sys.argv[1:]

    try:
        opts, args = getopt.getopt(argv, "h:a:o:", ["address=", "outputfile="])
        # option has to be two, if not then exit.
        if 2 != len(opts):
            print "get_abi.py -a <address> -o <outputfile>"
            sys.exit(2)
    except getopt.GetoptError:
        print "get_abi.py -a <address> -o <outputfile>"
        sys.exit(2)

    for opt, arg in opts:
        if opt == "-h":
            print "get_abi.py -a <address> -o <outputfile.abi>"
            sys.exit()
        elif opt in ("-a", "--address"):
            contractAddr = arg
        elif opt in ("-o", "--outputfile"):
            outputName = arg

    print "address is ", contractAddr
    print "output file is", outputName

    process = ContractPreProcess()
    jsonObj = process.send_request(contractAddr)
    process.save_json(jsonObj, outputName)
