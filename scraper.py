# Since Kiranico API doesn't exist yet...

import requests, json, re
from bs4 import BeautifulSoup
from time import sleep, strftime


# helper function for writing console messages
def log_msg(msg):
    now = strftime("%H:%M:%S")
    print "[%s] %s" % (now, msg)


# function to scrape monster data from kiranico
# generates both monsterList.json and monsterData.json
def scrape_monsters():
    url = 'http://mhgen.kiranico.com/monster'
    monsterList = []
    monsterData = {}

    log_msg("Grabbing monster list")
    monsterListRaw = requests.get(url)
    parsedMonsterList = BeautifulSoup(monsterListRaw.content, 'html.parser', from_encoding='utf-8')

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
        log_msg(" + %s: %s" % (monster['id'], monster['name']))
        monsterData[str(monster['id'])] = {
            "id": monster['id'],
            "name": monster['name'],
            "damageStates": [],
        }
        monsterDataRaw = requests.get(monster['urlKiranico'])
        parsedMonsterData = BeautifulSoup(monsterDataRaw.content, 'html.parser', from_encoding='utf-8')
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
    json.dump(monsterList, fmlist, sort_keys=True)

    log_msg(" + monsterData.json")
    fmdata = open("build/json/monsterData.json", "w")
    json.dump(monsterData, fmdata, sort_keys=True)


def scrape_weapons():
    global weaponStartUrl, weaponList, weaponData  # import globals
    log_msg("Grabbing weapon list and data")
    while len(weaponStartUrl) > 0:
        scrape_weapon(weaponStartUrl)
    # generate files since we're done with the last weapon
    log_msg("Generating json files")
    log_msg(" + weaponList.json")
    fmlist = open("build/json/weaponList.json", "w")
    json.dump(weaponList, fmlist, sort_keys=True)

    log_msg(" + weaponData.json")
    fmdata = open("build/json/weaponData.json", "w")
    json.dump(weaponData, fmdata, sort_keys=True)


def scrape_weapon(url):
    global weaponStartUrl, weaponIdTracker, weaponList, weaponData  # import globals
    weaponTypes = ['none', 'greatsword', 'longsword', 'swordshield', 'dualblades', 'hammer', 'huntinghorn',
                   'lance', 'gunlance', 'switchaxe', 'insectglaive', 'chargeblade']
    weaponTypeId = -1
    elementalTypes = ['None', 'Fire', 'Water', 'Ice', 'Thunder', 'Dragon', 'Poison', 'Sleep', 'Para', 'Blast']
    # figure out what type of weapon this is from url
    for wtId, weaponType in enumerate(weaponTypes):
        if weaponType in url:
            weaponTypeId = wtId
    sleep(0.5)
    weaponRaw = requests.get(url)
    parsedWeapon = BeautifulSoup(weaponRaw.content, 'html.parser', from_encoding='utf-8')
    if weaponTypeId > -1:
        # found melee weapon, so parse it
        weaponsBody = parsedWeapon.find('table', class_='table table-sm')
        weaponRows = weaponsBody.find_all('tr')
        for row in weaponRows:
            # find all weapons on page
            weaponIdTracker += 1
            log_msg(" + %s: %s" % (weaponIdTracker, row.contents[1].string.strip()))
            # declare defaults
            affinity = 0
            elements = []
            foundSharpnesses = []
            # find and set affinity, if applicable
            for divContent in row.contents[5].find_all('div'):
                smallContent = divContent.find('small')
                smallContentParsed = smallContent.contents[0].string.strip()
                m = re.search('(\+?\-?[\d]+)\%', smallContentParsed)
                if m:
                    affinity = int(m.group(1))
                # find and set element(s), if applicable
                m = re.search('([\d]+) (Fire|Water|Ice|Thunder|Dragon|Poison|Sleep|Para|Blast)', smallContentParsed)
                if m:
                    elements.append({"attack": int(m.group(1)), "id": elementalTypes.index(m.group(2)), "name": m.group(2)})
            # find sharpness bars
            sharpnesses = row.contents[7].find_all('div')
            for i, sharpness in enumerate(sharpnesses):
                # iterate through sharpness bars
                spans = sharpness.find_all('span')
                tempSharpness = []
                for span in spans:
                    # find individual sharpness bar spans and their widths
                    m = re.search('width:([\d]+)px', span.attrs['style'])
                    tempSharpness.append(int(m.group(1)))
                foundSharpnesses.append(tempSharpness)
            weaponList[str(weaponTypeId)].append({
                "id": weaponIdTracker,
                "name": row.contents[1].string.strip()
            })
            weaponData[str(weaponIdTracker)] = {
                "id": weaponIdTracker,
                "name": row.contents[1].string.strip(),
                "type": weaponType,
                "attack": row.contents[3].string.strip(),
                "elements": elements,
                "affinity": affinity,
                "sharpnesses": foundSharpnesses,
                "urlKiranico": url
            }
    else:
        log_msg(" o Non-melee weapon; skipping")
    nextWeaponDiv = parsedWeapon.find('div', class_='col-md-6 col-lg-4 pull-md-right')
    nextWeaponA = nextWeaponDiv.find('a')
    if nextWeaponA:
        # continue to next weapon
        weaponStartUrl = nextWeaponA.attrs['href']
    else:
        weaponStartUrl = ''


# start url for weapon parser
weaponStartUrl = 'http://mhgen.kiranico.com/greatsword/petrified-blade'  # start; first weapon
# weaponStartUrl = 'http://mhgen.kiranico.com/chargeblade/starlight-axe'  # for testing; affinity, elements; last weapon
# weaponStartUrl = 'http://mhgen.kiranico.com/dualblades/cleaving-jaws'  # for testing; dual elements
# weaponStartUrl = 'http://mhgen.kiranico.com/lightbowgun/petrified-shooter'  # for testing; first bowgun

# global defaults for weapon data
weaponIdTracker = 0
weaponList = {"1": [], "2": [], "3": [], "4": [], "5": [], "6": [], "7": [], "8": [], "9": [], "10": [], "11": []}
weaponData = {}

# scrape_monsters()
scrape_weapons()
