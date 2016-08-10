# Since Kiranico API doesn't exist yet...

import requests, json
from bs4 import BeautifulSoup
from time import sleep, strftime


# helper function for writing console messages
def log_msg(msg):
    now = strftime("%Y-%m-%d %H:%M:%S")
    print "[%s] %s" % (now, msg)


# function to scrape monster data from kiranico
# generates both monsterList.json and monsterData.json
def scrape_monsters():
    url = 'http://mhgen.kiranico.com/monster'
    monsterList = []
    monsterData = {}

    log_msg("Grabbing monster list")
    monsterListRaw = requests.get(url)
    parsedMonsterList = BeautifulSoup(monsterListRaw.content,
                                      'html.parser',
                                      from_encoding='utf-8')

    # fill in monsterList
    monsterCount = 1
    for link in parsedMonsterList.find_all('a'):
        if link.parent.name == 'hr':
            monsterList.append({
                "id": monsterCount,
                "name": link.contents[0].strip(),
                "urlKiranico": link.attrs['href']
            })
            monsterCount += 1

    # fill in monsterData
    log_msg("Grabbing monster data")
    for monster in monsterList:
        sleep(0.2)
        log_msg(" + %s" % monster['name'])
        monsterData[str(monster['id'])] = {
            "id": monster['id'],
            "name": monster['name'],
            "damageStates": [],
        }
        monsterDataRaw = requests.get(monster['urlKiranico'])
        parsedMonsterData = BeautifulSoup(monsterDataRaw.content,
                                          'html.parser',
                                          from_encoding='utf-8')
        monsterContent = parsedMonsterData.find('div', 'tab-content')
        monsterRows = monsterContent.find_all('tr')

        # temp damage states... might require manual massaging of output json
        damageStates = ["Default", "B", "C", "D", "E"]
        damageStateCounter = -1
        currState = ""
        for row in monsterRows:
            if row.contents[1].string.strip() == 'Body Part':
                # when 'Body Part' cell is seen, it's a new damage state
                damageStateCounter += 1
                currState = damageStates[damageStateCounter]
                monsterData[str(monster['id'])]['damageStates'].append({
                    "displayName": currState,
                    "name": currState
                })
                monsterData[str(monster['id'])]['damage' + currState] = []
            else:
                monsterData[str(monster['id'])]['damage' + currState].append({
                    "name": row.contents[1].string.strip(),
                    "damage": [
                        int(row.contents[3].string.strip()),
                        int(row.contents[5].string.strip()),
                        int(row.contents[7].string.strip()),
                        int(row.contents[9].string.strip()),
                        int(row.contents[11].string.strip()),
                        int(row.contents[13].string.strip()),
                        int(row.contents[15].string.strip()),
                        int(row.contents[17].string.strip())
                    ]
                })

    # generate files
    log_msg("Generating json files")
    log_msg(" + monsterList.json")
    fmlist = open("build/json/monsterList.json", "w")
    json.dump(monsterList, fmlist)

    log_msg(" + monsterData.json")
    fmdata = open("build/json/monsterData.json", "w")
    json.dump(monsterData, fmdata)


def scrape_weapons():
    weaponTypes = ['greatsword', 'longsword', 'swordshield', 'dualblades',
                   'hammer', 'huntinghorn', 'lance', 'gunlance', 'switchaxe',
                   'insectglaive', 'chargeblade']
    for weaponType in weaponTypes:
        pass


# scrape_monsters()
