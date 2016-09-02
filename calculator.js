var React = require("react");
var ReactDOM = require("react-dom");
var Hashids = require("hashids");
var url = require("url");

// define globals
var weaponTypeList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
var sharpnesses = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'White', 'Purple'];
var elementalTypes = ['None', 'Fire', 'Water', 'Ice', 'Thunder', 'Dragon', 'Poison', 'Sleep', 'Para', 'Blast'];
var saxePhials = ['Power', 'Element'];
var cbladePhials = ['Impact', 'Element'];
var monsterWeaknessCategories = ['Cut', 'Impact', 'Shot', 'Fire', 'Water', 'Ice', 'Thunder', 'Dragon'];
var lsSpiritOptions = ['None', 'White', 'Yellow', 'Red'];
var cbPhialOptions = [1, 2, 3, 4, 5, 6];
var hashids = new Hashids('calculating');

class CalculatingPalicoX extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            weaponTypes: null,
            weaponList: null,
            weaponData: null,
            monsterList: null,
            monsterData: null,
            modifiers: null,
            modifierDisplayGroups: null,
            modifierGroups: null,
            importedSetups: null
        };
        this.parseModifierGroups = this.parseModifierGroups.bind(this);
    }

    componentDidMount() {
        // load all files on mount
        let jsonFiles = [
            'json/weaponType.json',
            'json/weaponList.json',
            'json/weaponData.json',
            'json/monsterList.json',
            'json/monsterData.json',
            'json/modifiers.json',
            'json/modifierDisplayGroups.json',
        ];
        Promise.all(jsonFiles.map(jsonFile =>
            fetch(jsonFile).then(rawJson => rawJson.json())
        )).then(jsons => {
            this.setState({
                weaponTypes: jsons[0],
                weaponList: jsons[1],
                weaponData: jsons[2],
                monsterList: jsons[3],
                monsterData: jsons[4],
                modifiers: jsons[5],
                modifierDisplayGroups: jsons[6],
            }, () => {
                this.parseModifierGroups();
            });
        });

        // load setups from url if applicable
        let tempHref = window.location.href && url.parse(window.location.href, true);
        if (tempHref.search.length > 0) {
            var importedSetups = {};
            // verify that input is ok
            if (tempHref.query.m && tempHref.query.s) {
                importedSetups.m = parseInt(tempHref.query.m);
                importedSetups.ms = tempHref.query.ms ? tempHref.query.ms : 'Default';
                importedSetups.s = [];
                let setupsSplit = tempHref.query.s.split('.');
                setupsSplit.map((setup, i) => {
                    let setupArray = hashids.decode(setup);
                    if (setupArray && setupArray.length >= 5) {
                        importedSetups.s.push(setupArray);
                    }
                })
                this.setState({importedSetups: importedSetups});
            }
        }
    }

    // build the modifierGroups object, which is a dictionary of keys of effectGroups
    // with an array of modifier ids associated with said group as their values
    parseModifierGroups() {
        var modifiers = this.state.modifiers;
        var modifierGroups = {};
        for (var modifier in modifiers) {
            if (modifiers.hasOwnProperty(modifier)) {
                modifiers[modifier].effectGroups.map(effectGroup => {
                    if (effectGroup in modifierGroups) {
                        // entry for effectGroup exists; push to its existing array
                        modifierGroups[effectGroup].push(parseInt(modifier));
                    } else {
                        // new entry for effectGroup
                        modifierGroups[effectGroup] = [parseInt(modifier)];
                    }
                });
            }
        }
        this.setState({modifierGroups: modifierGroups});
    }

    render() {
        return (
            <div>
                <nav className="navbar navbar-default">
                    <div className="container">
                        <div className="navbar-header">
                            <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar-collapse" aria-expanded="false">
                                <span className="sr-only">Toggle navigation</span>
                                <span className="icon-bar"></span>
                                <span className="icon-bar"></span>
                                <span className="icon-bar"></span>
                            </button>
                            <a href={urlHome(window.location.href)} className="navbar-brand">the Calculating Palico X</a>
                        </div>
                        <div className="collapse navbar-collapse" id="navbar-collapse">
                            <ul className="nav navbar-nav navbar-right">
                                <li>
                                    <a href="http://github.com/mrmin123/the-calculating-palico-x"><i className="material-icons">code</i> view source on github</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </nav>
                {(this.state.weaponTypes && this.state.weaponList && this.state.weaponData && this.state.monsterList && this.state.monsterData
                    && this.state.modifiers && this.state.modifierDisplayGroups && this.state.modifierGroups) ?
                    <CalculatingPalicoXInterface
                        weaponTypes={this.state.weaponTypes}
                        weaponList={this.state.weaponList}
                        weaponData={this.state.weaponData}
                        monsterList={this.state.monsterList}
                        monsterData={this.state.monsterData}
                        modifiers={this.state.modifiers}
                        modifierDisplayGroups={this.state.modifierDisplayGroups}
                        modifierGroups={this.state.modifierGroups}
                        importedSetups={this.state.importedSetups}
                    />
                : null}
                <div className="footer">
                    Send feedback, suggestions, corrections via&nbsp;
                    <a href="http://github.com/mrmin123/the-calculating-palico-x">Github</a> //&nbsp;
                    <a href="https://www.reddit.com/message/compose?to=mrmin123&subject=calculatingpalicox">Reddit</a> //&nbsp;
                    <a href="https://twitter.com/mrmin123">Twitter</a>
                </div>
            </div>
        );
    }
};

class CalculatingPalicoXInterface extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            iconWeaponPanel: true,
            iconMonsterPanel: true,
            iconModifiersPanel: false,
            showAggregateDmg: true,
            selectedSetup: 0,
            selectedWeaponType: null,
            selectedWeapon: null,
            selectedMonster: null,
            selectedMonsterData: null,
            selectedMonsterState: null,
            selectedMonsterBrokenParts: [],
            selectedModifiers: [],
            currModifierGroup: [],
            sharpnessPlus: 0,
            setups: [],
            codes: []
        };
        // methods related to setups
        this.addSetup = this.addSetup.bind(this);
        this.delSetup = this.delSetup.bind(this);
        this.activateSetup = this.activateSetup.bind(this);
        this.updateSetup = this.updateSetup.bind(this);
        // methods related to UI-related elements
        this.toggleShowAggregateDmg = this.toggleShowAggregateDmg.bind(this);
        this.calcMonsterWeaknessAverages = this.calcMonsterWeaknessAverages.bind(this);
        this.codeUpdate = this.codeUpdate.bind(this);
        this.handlePanelClick = this.handlePanelClick.bind(this);
        // methods related to weapon settings
        this.handleWeaponTypeSelection = this.handleWeaponTypeSelection.bind(this);
        this.handleWeaponSelection = this.handleWeaponSelection.bind(this);
        // methods related to monster settings
        this.handleMonsterSelection = this.handleMonsterSelection.bind(this);
        this.handleMonsterStateSelection = this.handleMonsterStateSelection.bind(this);
        // method related to modifier settings
        this.modifierMouseOver = this.modifierMouseOver.bind(this);
        this.modifierMouseLeave = this.modifierMouseLeave.bind(this);
        this.modifierSelection = this.modifierSelection.bind(this);
        // method related to handling monster part breaking
        this.handleMonsterPartBreakToggle = this.handleMonsterPartBreakToggle.bind(this);
    }

    componentDidMount() {
        let importedSetups = this.props.importedSetups;
        if (importedSetups) {
            this.setState({
                selectedMonster: importedSetups.m,
                selectedMonsterData: this.props.monsterData[importedSetups.m],
                selectedMonsterState: importedSetups.ms
            });
            importedSetups.s.map(setup => {
                this.addSetup(setup);
            });
        } else {
            // add first default setup
            this.addSetup(null);
        }
    }

    // method for adding a setup
    //  importedSetup : setup object passed in from parent, if applicable
    addSetup(importedSetup) {
        // initialize new setup object
        let newSetup = {
                selectedWeaponType: null,
                selectedWeapon: null,
                selectedModifiers: [],
                imported: false,
            };
        newSetup.calculatedModifiers = {
            pAdd: 0, pMul: 0, aff: 0, vo: false, wex: false, cbo: false, ec: false, sharpness: -1, lsspirit: 0, phialc: 1,
            elem: [{eAdd: 0, eMul: 0}, {eAdd: 0, eMul: 0}, {eAdd: 0, eMul: 0}, {eAdd: 0, eMul: 0}, {eAdd: 0, eMul: 0}]
        };
        let setups = this.state.setups,
            codes = this.state.codes,
            lastSetup = setups.length - 1;
        if (!importedSetup) {
            if (lastSetup == -1 || setups[lastSetup].selectedWeapon) {
                // if the last setup does not exist (on init) or the last setup is a valid setup (has a weapon),
                // add a new setup object
                setups.push(newSetup);
                codes.push('');
                lastSetup = setups.length - 1;
            } else {
                // if the last setup is not a valid setup (has no weapon), just re-use it
                setups[lastSetup] = newSetup;
                codes[lastSetup] = '';
            }
            this.setState({
                selectedSetup: lastSetup,
                selectedWeaponType: null,
                selectedWeapon: null,
                selectedModifiers: [],
                sharpnessPlus: 0,
                setups: setups,
                codes: codes
            });
            scrollToTop(); // scroll to top so the user doesn't have to manually do so
        } else {
            // fill in values from loaded setup
            let importedSetupModifiers = importedSetup.slice(5);
            newSetup.imported = true;
            newSetup.selectedWeaponType = importedSetup[0];
            newSetup.selectedWeapon = importedSetup[1];
            newSetup.selectedWeaponData = this.props.weaponData[importedSetup[1]];
            newSetup.selectedModifiers = importedSetupModifiers;
            newSetup.calculatedModifiers.sharpness = importedSetup[2];
            newSetup.calculatedModifiers.lsspirit = importedSetup[3];
            newSetup.calculatedModifiers.phialc = importedSetup[4];
            // add new setup and push to state obj
            setups.push(newSetup);
            codes.push('');
            lastSetup = setups.length - 1;
            this.setState({
                selectedSetup: lastSetup,
                selectedWeaponType: importedSetup[0],
                selectedWeapon: importedSetup[1],
                selectedModifiers: importedSetupModifiers,
                sharpnessPlus: (importedSetupModifiers.indexOf(3) > -1 || importedSetupModifiers.indexOf(2) > -1 ? (importedSetupModifiers.indexOf(2) > -1 ? 2 : 1) : 0),
                setups: setups,
                codes: codes
            });
        }
    }

    // method for deleting a setup
    //  i : index of setup to be deleted
    delSetup(i) {
        let setups = this.state.setups,
            codes = this.state.codes;
        setups.splice(i, 1);
        codes.splice(i, 1);
        this.setState({setups: setups, codes: codes});
        this.activateSetup(0); // automatically select the first setup
    }

    // method for activating a stored setup
    //  i : index of setup to be activated
    activateSetup(i) {
        let retrievedSetup = this.state.setups[i];
        this.setState({
            selectedSetup: i,
            selectedWeaponType: retrievedSetup.selectedWeaponType,
            selectedWeapon: retrievedSetup.selectedWeapon,
            selectedModifiers: retrievedSetup.selectedModifiers,
            sharpnessPlus: (retrievedSetup.selectedModifiers.indexOf(3) > -1 || retrievedSetup.selectedModifiers.indexOf(2) > -1 ? (retrievedSetup.selectedModifiers.indexOf(2) > -1 ? 2 : 1) : 0)
        });
        scrollToTop();
    }

    // method for updating the currently activated setup object
    //  selectedSetup : index of setup to be updated
    //  field         : name of field in setup object to be updated, in an array
    //  value         : value to update the setup object with, in an array
    updateSetup(selectedSetup, fields, values) {
        var tempSetups = this.state.setups;
        fields.map((field, i) => {
            if (field == 'selectedWeaponData') {
                // deep copy selectedWeaponData from this.props.weaponData, otherwise editing relic values will
                // replace values in this.props.weaponData
                tempSetups[selectedSetup].selectedWeaponData = $.extend(true, {}, values[i]);
            } else {
                tempSetups[selectedSetup][field] = values[i];
            }
        });
        this.setState({setups: tempSetups});
    }

    // method for handling the 'show aggregate damage' checkbox toggle
    toggleShowAggregateDmg() {
        this.setState({showAggregateDmg: this.state.showAggregateDmg ? false : true});
    }

    // method for calculating the monster weakness averages after a monster is selected
    calcMonsterWeaknessAverages() {
        var monsterWeaknesses = [0, 0, 0, 0, 0, 0, 0, 0],
            count = 0;
        // add up damages per damage type for the monster and its monster state, while counting how many locations have been added
        this.state.selectedMonsterData['damage' + this.state.selectedMonsterState].map((monsterWeakness, i) => {
            count += 1;
            monsterWeakness.damage.map((damageVal, i) => {
                monsterWeaknesses[i] += damageVal;
            })
        });
        return (
            monsterWeaknesses.map((monsterWeakness, i) => {
                return (
                    <div className="row" key={i}>
                        <div className="col-xs-6 col-sm-6 text-right"><span className={monsterWeaknessCategories[i]}>{monsterWeaknessCategories[i]}</span></div>
                        <div className="col-xs-6 col-sm-6">{(monsterWeakness / count).toFixed(2)}</div>
                    </div>
                );
            })
        );
    }

    // method sent to SetupDamageTable class to update the url with new codes
    codeUpdate(code, i) {
        let codes = this.state.codes;
        codes[i] = code;
        window.history.replaceState(window.state, '', urlQueryEdit(window.location.href, 's', codes.join('.')));
    }

    // method to handle clicking of panels, setting their icon states
    //  panel : name of panel being clicked on
    handlePanelClick(panel) {
        switch (panel) {
            case 'weapon':
                this.setState({iconWeaponPanel: this.state.iconWeaponPanel ? false : true});
                break;
            case 'monster':
                this.setState({iconMonsterPanel: this.state.iconMonsterPanel ? false : true});
                break;
            case 'modifiers':
                this.setState({iconModifiersPanel: this.state.iconModifiersPanel ? false : true});
                break;
        }
    }

    // method for handling the weapon type dropdown selection
    handleWeaponTypeSelection(ref) {
        this.updateSetup(this.state.selectedSetup, ['selectedWeaponType', 'selectedWeapon', 'imported'], [parseInt(ref.target.value), null, false]);
        this.setState({
            selectedWeaponType: ref.target.value,
            selectedWeapon: '',
        });
    }

    // method for handling the weapon dropdown selection
    handleWeaponSelection(ref) {
        this.updateSetup(this.state.selectedSetup, ['selectedWeapon', 'selectedWeaponData', 'imported'], [parseInt(ref.target.value), this.props.weaponData[ref.target.value], false]);
        this.setState({
            selectedWeapon: ref.target.value
        });
    }

    // method for handling the monster dropdown selection
    handleMonsterSelection(ref) {
        this.setState({
            selectedMonster: parseInt(ref.target.value),
            selectedMonsterData: this.props.monsterData[ref.target.value],
            selectedMonsterState: this.props.monsterData[ref.target.value].damageStates[0].name
        });
        // update the url since there is only one monster per page
        window.history.replaceState(window.state, '', urlQueryEdit(window.location.href, 'm', ref.target.value));
    }

    // method for handling the monster state dropdown selection
    handleMonsterStateSelection(ref) {
        this.setState({
            selectedMonsterState: ref.target.value
        })
        // update the url since there is only one monster state per page
        if (ref.target.value == 'Default') {
            // remove the ms param if going back to Default state
            window.history.replaceState(window.state, '', urlQueryEdit(window.location.href, 'ms', ''));
        } else {
            window.history.replaceState(window.state, '', urlQueryEdit(window.location.href, 'ms', ref.target.value));
        }
    }

    // method for setting the currModifierGroup array based on mouse hover over modifier. Modifiers
    // in the currModifierGroup array are highlighted in gray in the modifiers list
    modifierMouseOver(modifier) {
        var currModifierGroup = [];
        this.props.modifiers[modifier].effectGroups.map(effectGroup => {
            currModifierGroup = currModifierGroup.concat(this.props.modifierGroups[effectGroup]);
        });
        this.setState({currModifierGroup: currModifierGroup});
    }

    // method for clearing currModifierGroup once the mouse stops hovering over a modifier
    modifierMouseLeave() {
        this.setState({currModifierGroup: []});
    }

    // method for handling any modifier checkbox selections
    //  modifier : id of modifier
    modifierSelection(modifier) {
        let selectedModifiers = this.state.selectedModifiers.slice(),
            SelectedModifiersPos = selectedModifiers.indexOf(modifier);
        if (SelectedModifiersPos === -1) {
            // un-check other modifiers that exist in the same effect group
            this.props.modifiers[modifier].effectGroups.map(effectGroup => {
                this.props.modifierGroups[effectGroup].map(effectGroupModifier => {
                    if (selectedModifiers.indexOf(effectGroupModifier) > -1) {
                        selectedModifiers.splice(selectedModifiers.indexOf(effectGroupModifier), 1);
                    }
                });
            });
            // if modifier is not already in selectedModifiers, add it...
            selectedModifiers.push(modifier);
        } else {
            // ... otherwise, remove it
            selectedModifiers.splice(SelectedModifiersPos, 1);
        }
        selectedModifiers.sort(); // sort the modifiers list
        // update the selected setup and any special modifier states if needed
        this.updateSetup(this.state.selectedSetup, ['selectedModifiers'], [selectedModifiers]);
        this.setState({
            selectedModifiers: selectedModifiers,
            sharpnessPlus: (selectedModifiers.indexOf(3) > -1 || selectedModifiers.indexOf(2) > -1 ? (selectedModifiers.indexOf(2) > -1 ? 2 : 1) : 0)
        });
    }

    handleMonsterPartBreakToggle(i) {
        let selectedMonsterBrokenParts = this.state.selectedMonsterBrokenParts;
        if (selectedMonsterBrokenParts.indexOf(i) > -1) {
            selectedMonsterBrokenParts.splice(selectedMonsterBrokenParts.indexOf(i), 1);
        } else {
            selectedMonsterBrokenParts.push(i);
        }
        this.setState({selectedMonsterBrokenParts: selectedMonsterBrokenParts});
    }

    render() {
        var weaponTypes = this.props.weaponTypes,
            weaponList = this.props.weaponList,
            weaponData = this.props.weaponData,
            monsterList = this.props.monsterList,
            monsterData = this.props.monsterData,
            modifiers = this.props.modifiers,
            modifierDisplayGroups = this.props.modifierDisplayGroups;
        var selectedWeaponType = this.state.selectedWeaponType,
            selectedWeapon = this.state.selectedWeapon,
            selectedWeaponData = this.state.setups[this.state.selectedSetup] && this.state.setups[this.state.selectedSetup].selectedWeaponData ? this.state.setups[this.state.selectedSetup].selectedWeaponData : null,
            selectedMonster = this.state.selectedMonster,
            selectedMonsterData = this.state.selectedMonsterData,
            selectedMonsterState = this.state.selectedMonsterState,
            selectedModifiers = this.state.selectedModifiers,
            setups = this.state.setups;
        var sharpnessPlus = this.state.sharpnessPlus,
            showAggregateDmg = this.state.showAggregateDmg;
        var currModifierGroup = this.state.currModifierGroup;
        return (
            <div className="container">
                <div className="row">
                    <div className="col-xs-12 col-sm-8">
                        <div className="panel panel-default">
                            <a href="#weapon" className="toggle-heading-button" role="button" data-toggle="collapse" aria-expanded="true" aria-controls="weapon" onClick={() => this.handlePanelClick('weapon')}>
                                <div className="panel-heading toggle-heading-div" data-toggle="tooltip" data-placement="bottom" title="toggle weapon panel">
                                    Weapon <i className={"fa " + (this.state.iconWeaponPanel ? "fa-chevron-down" : "fa-chevron-up") + " float-right"}></i>
                                </div>
                            </a>
                            <div className="collapse in" id="weapon">
                                <div className="panel-body">
                                    <div className="row">
                                        <div className="col-xs-12 col-sm-6">
                                            <div className="form-group">
                                                <div className="col-xs-12 col-sm-10 float-right">
                                                    <select className="form-control" value={selectedWeaponType ? selectedWeaponType : ""} onChange={this.handleWeaponTypeSelection}>
                                                        <option value="" disabled={true}>-- Select Weapon Type --</option>
                                                        {weaponTypes ?
                                                            weaponTypeList.map(weaponType => {
                                                                return (<option key={weaponType} value={weaponType}>{weaponTypes[weaponType].name}</option>);
                                                            })
                                                        : null}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-xs-12 col-sm-6">
                                            <div className="form-group">
                                                <div className="col-xs-12 col-sm-10">
                                                    <select className="form-control" value={selectedWeapon ? selectedWeapon : ""} onChange={this.handleWeaponSelection}>>
                                                    {selectedWeaponType ?
                                                        <option value="" disabled={true}>-- Select Weapon --</option>
                                                    : null}
                                                    {selectedWeaponType ?
                                                        weaponList[selectedWeaponType].sort((a, b) => {
                                                            return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);
                                                        }).map(weapon => {
                                                            return (<option key={weapon.id} value={weapon.id}>{weapon.name}</option>);
                                                        })
                                                    : null}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {selectedWeaponData ?
                                        <div>
                                            <div className="row top-pad">
                                                <div className="col-xs-6 col-sm-6 text-right">Damage</div>
                                                <div className="col-xs-6 col-sm-6">{selectedWeaponData.attack}</div>
                                            </div>
                                            <div className="row top-pad">
                                                <div className="col-xs-6 col-sm-6 text-right">Affinity</div>
                                                <div className="col-xs-6 col-sm-6">{selectedWeaponData.affinity}</div>
                                            </div>
                                            {selectedWeaponData.elements.length > 0 ?
                                                selectedWeaponData.elements.map((element, i) => {
                                                    return (
                                                        <div className="row top-pad" key={i}>
                                                            <div className="col-xs-6 col-sm-6 text-right">Element</div>
                                                            <div className="col-xs-6 col-sm-6">
                                                                {element.attack} <i className={"fa element-marker " + (!element.awakenRequired ? "fa-circle " : (selectedModifiers.indexOf(3) > -1 ? "fa-circle " : "fa-circle-o ")) + element.name}></i> {element.name}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            : null}
                                            {selectedWeaponData.phial ?
                                                <div className="row top-pad">
                                                    <div className="col-xs-6 col-sm-6 text-right">Phial</div>
                                                    <div className="col-xs-6 col-sm-6">{selectedWeaponData.phial}</div>
                                                </div>
                                            : null}
                                            <div className="row top-pad">
                                                <div className="col-xs-6 col-sm-6 text-right">Sharpness</div>
                                                <div className="col-xs-6 col-sm-6">
                                                    <div className={"sharpness-bar" + (sharpnessPlus == 0 ? " active" : "")}>
                                                        <span style={{width: selectedWeaponData.sharpnesses[0][0]}} className="red"></span>
                                                        <span style={{width: selectedWeaponData.sharpnesses[0][1]}} className="orange"></span>
                                                        <span style={{width: selectedWeaponData.sharpnesses[0][2]}} className="yellow"></span>
                                                        <span style={{width: selectedWeaponData.sharpnesses[0][3]}} className="green"></span>
                                                        <span style={{width: selectedWeaponData.sharpnesses[0][4]}} className="blue"></span>
                                                        <span style={{width: selectedWeaponData.sharpnesses[0][5]}} className="white"></span>
                                                        <span style={{width: selectedWeaponData.sharpnesses[0][6]}} className="purple"></span>
                                                    </div>
                                                    <div className={"sharpness-bar" + (sharpnessPlus == 1 ? " active" : "")}>
                                                        <span style={{width: selectedWeaponData.sharpnesses[1][0]}} className="red"></span>
                                                        <span style={{width: selectedWeaponData.sharpnesses[1][1]}} className="orange"></span>
                                                        <span style={{width: selectedWeaponData.sharpnesses[1][2]}} className="yellow"></span>
                                                        <span style={{width: selectedWeaponData.sharpnesses[1][3]}} className="green"></span>
                                                        <span style={{width: selectedWeaponData.sharpnesses[1][4]}} className="blue"></span>
                                                        <span style={{width: selectedWeaponData.sharpnesses[1][5]}} className="white"></span>
                                                        <span style={{width: selectedWeaponData.sharpnesses[1][6]}} className="purple"></span>
                                                    </div>
                                                    <div className={"sharpness-bar" + (sharpnessPlus == 2 ? " active" : "")}>
                                                        <span style={{width: selectedWeaponData.sharpnesses[2][0]}} className="red"></span>
                                                        <span style={{width: selectedWeaponData.sharpnesses[2][1]}} className="orange"></span>
                                                        <span style={{width: selectedWeaponData.sharpnesses[2][2]}} className="yellow"></span>
                                                        <span style={{width: selectedWeaponData.sharpnesses[2][3]}} className="green"></span>
                                                        <span style={{width: selectedWeaponData.sharpnesses[2][4]}} className="blue"></span>
                                                        <span style={{width: selectedWeaponData.sharpnesses[2][5]}} className="white"></span>
                                                        <span style={{width: selectedWeaponData.sharpnesses[2][6]}} className="purple"></span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    : null}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xs-12 col-sm-4">
                        <div className="panel panel-default">
                            <a href="#monster" className="toggle-heading-button" role="button" data-toggle="collapse" aria-expanded="true" aria-controls="monster" onClick={() => this.handlePanelClick('monster')}>
                                <div className="panel-heading toggle-heading-div" data-toggle="tooltip" data-placement="bottom" title="toggle meownster panel">
                                    Meownster <i className={"fa " + (this.state.iconMonsterPanel ? "fa-chevron-down" : "fa-chevron-up") + " float-right"}></i>
                                </div>
                            </a>
                            <div className="collapse in" id="monster">
                                <div className="panel-body">
                                    <div className="row">
                                        <div className="col-xs-12 col-sm-12">
                                            <div className="form-group">
                                                <div className="col-xs-12 col-sm-12">
                                                    <select className="form-control" value={selectedMonster ? selectedMonster : ""} onChange={this.handleMonsterSelection}>
                                                        <option value="" disabled={true}>-- Select Target Meownster --</option>
                                                        {monsterList ?
                                                            monsterList.sort((a, b) => {
                                                                return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);
                                                            }).map(monster => {
                                                                return (<option key={monster.id} value={monster.id}>{monster.name}</option>);
                                                            })
                                                        : null}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {selectedMonsterData ?
                                        <div className="weakness-summary">
                                            <div className="row">
                                                <div className="col-xs-12 col-sm-12">
                                                    <div className="form-group">
                                                        <div className="col-xs-12 col-sm-12">
                                                            <select className="form-control" value={selectedMonsterState ? selectedMonsterState : "damageDefault"} onChange={this.handleMonsterStateSelection}>
                                                                {selectedMonsterData.damageStates.map((damageState, i) => {
                                                                    return (<option key={i} value={damageState.name}>Monster State: {damageState.displayName}</option>);
                                                                })}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-xs-12 col-sm-12 text-center"><div className="row">Weakness Averages</div></div>
                                            </div>
                                            {selectedMonsterState ? this.calcMonsterWeaknessAverages.call(this) : null}
                                        </div>
                                    : null}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-xs-12 col-sm-12">
                        <div className="panel panel-default">
                            <a href="#modifiers" className="toggle-heading-button" role="button" data-toggle="collapse" aria-expanded="false" aria-controls="modifiers" onClick={() => this.handlePanelClick('modifiers')}>
                                <div className="panel-heading toggle-heading-div" data-toggle="tooltip" data-placement="bottom" title="toggle meowdifiers panel">
                                    Meowdifiers <i className={"fa " + (this.state.iconModifiersPanel ? "fa-chevron-down" : "fa-chevron-up") + " float-right"}></i>
                                </div>
                            </a>
                            <div className="collapse" id="modifiers">
                                <div className="panel-body modifiers-list">
                                    {modifierDisplayGroups && modifiers ?
                                        modifierDisplayGroups.map((col, i) => {
                                            return (
                                                <div className="col-xs-12 col-sm-3" key={i}>
                                                    {modifierDisplayGroups[i].map((group, j) => {
                                                        return (
                                                            <div key={j}>
                                                                <div className="row">
                                                                    <div className="col-xs-8 col-sm-8 text-right section-header"><i className="fa fa-cog"></i> <strong>{modifierDisplayGroups[i][j].name}</strong></div>
                                                                </div>
                                                                {modifierDisplayGroups[i][j].modifiers.map((modifier, k) => {
                                                                    return (
                                                                        <div className="row" key={k}>
                                                                            <div className="checkbox">
                                                                                <label className={"col-xs-12 col-sm-12 tooltip2" + (currModifierGroup.indexOf(modifier) > -1 ? " modifiers-group" : "")}
                                                                                    onMouseOver={() => this.modifierMouseOver(modifier)} onMouseLeave={this.modifierMouseLeave}
                                                                                    data-toggle="tooltip" data-placement="bottom" data-tooltip={modifiers[modifier].desc}>
                                                                                    <div className="col-xs-8 col-sm-8 modifiers-label text-right">{modifiers[modifier].name}</div>
                                                                                    <div className="col-xs-2 col-sm-2 modifiers-check">
                                                                                        <input type="checkbox" checked={selectedModifiers.indexOf(modifier) > -1 ? true : false} onChange={() => this.modifierSelection(modifier)} />
                                                                                        <span className="checkbox-material"><span className="check"></span></span>
                                                                                    </div>
                                                                                </label>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })
                                    : null}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-xs-12 col-sm-12">
                        <div className="panel panel-default">
                            <div className="panel-heading">Damage Calculations <i className="fa fa-chevron-right "></i> <div className="checkbox inline small"><label className="aggregate-label">show aggregate damage values <input type="checkbox" checked={showAggregateDmg} onChange={this.toggleShowAggregateDmg} /></label></div></div>
                            {selectedMonsterData ?
                                <div className="panel-body dmg-body">
                                    {setups.map((setup, i) => {
                                        return (
                                            setup.selectedWeapon ?
                                                <div key={i}>
                                                    <SetupDamageTable
                                                        showAggregateDmg={showAggregateDmg}
                                                        weaponTypes={weaponTypes}
                                                        modifiers={modifiers}
                                                        selectedMonsterData={selectedMonsterData}
                                                        selectedMonsterState={selectedMonsterState}
                                                        selectedMonsterBrokenParts={this.state.selectedMonsterBrokenParts}
                                                        setup={setup}
                                                        setupInfo={{key: i, count: (setups[setups.length - 1].selectedWeapon ? setups.length : setups.length - 1), selected: this.state.selectedSetup}}
                                                        addSetup={this.addSetup}
                                                        activateSetup={this.activateSetup}
                                                        delSetup={this.delSetup}
                                                        codeUpdate={this.codeUpdate}
                                                        handleMonsterPartBreakToggle={this.handleMonsterPartBreakToggle}
                                                    />
                                                </div>
                                            : null
                                        );
                                    })}
                                </div>
                            : null}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
};

// class to render the damage calculation tables
class SetupDamageTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showAggregateDmg: this.props.showAggregateDmg,
            selectedMonsterData: this.props.selectedMonsterData,
            selectedMonsterState: this.props.selectedMonsterState,
            selectedMonsterBrokenParts: this.props.selectedMonsterBrokenParts,
            setup: this.props.setup,
            setupInfo: this.props.setupInfo,
            sharpnessPlus: (this.props.setup.selectedModifiers.indexOf(3) > -1 || this.props.setup.selectedModifiers.indexOf(2) > -1 ?
                (this.props.setup.selectedModifiers.indexOf(2) > -1 ? 2 : 1) : 0),
            selectedSharpness: this.props.setup.calculatedModifiers.sharpness,
            selectedSharpnessFlag: false,
            selectedSpirit: this.props.setup.calculatedModifiers.lsspirit,
            selectedPhials: this.props.setup.calculatedModifiers.phialc,
            brokenParts: this.props.brokenParts,
            calculatedModifiers: this.props.setup.calculatedModifiers,
            tableValues: null,
            code: null
        };
        this.setSelectedSharpness = this.setSelectedSharpness.bind(this);
        this.calculateModifiers = this.calculateModifiers.bind(this);
        this.calculateTable = this.calculateTable.bind(this);
        this.setMinMax = this.setMinMax.bind(this);
        this.calcHeatmapColor = this.calcHeatmapColor.bind(this);
        this.handleSharpnessSelection = this.handleSharpnessSelection.bind(this);
        this.handleSpiritSelection = this.handleSpiritSelection.bind(this);
        this.handlePhialSelection = this.handlePhialSelection.bind(this);
        this.generateCode = this.generateCode.bind(this);
    }

    componentDidMount() {
        // fire off setSelectedSharpness on mount (chains into calculateModifiers())
        this.setSelectedSharpness(this.state.setup.selectedWeaponData.sharpnesses, this.props.setup.selectedModifiers);
    }

    componentWillReceiveProps(nextProps) {
        // fire off setSelectedSharpness on props upate (chains into calculateModifiers())
        this.setState({
            showAggregateDmg: nextProps.showAggregateDmg,
            selectedMonsterData: nextProps.selectedMonsterData,
            selectedMonsterState: nextProps.selectedMonsterState,
            selectedMonsterBrokenParts: nextProps.selectedMonsterBrokenParts,
            setup: nextProps.setup,
            setupInfo: nextProps.setupInfo,
            tableValues: null // reset tableValues so the renderer doesn't get confused grabbing data from old data
        }, () => {
            this.setSelectedSharpness(this.state.setup.selectedWeaponData.sharpnesses, nextProps.setup.selectedModifiers);
        });
    }

    // method to figure out list of sharpnesses in dropdown
    //  sharpnesses       : sharpness scales from weaponData
    //  selectedModifiers : selectedModifiers from setup
    setSelectedSharpness(sharpnesses, selectedModifiers) {
        let selectedSharpnessFlag = this.state.selectedSharpnessFlag;
        // set selectedSharpness selection based on selected weapon/relic and import flag
        let selectedSharpness,
            sharpnessPlus = (selectedModifiers.indexOf(3) > -1 || selectedModifiers.indexOf(2) > -1 ? (selectedModifiers.indexOf(2) > -1 ? 2 : 1) : 0);
        if (this.state.setup.imported) {
            // if importing a setup, set sharpness to whatever is in the setup
            selectedSharpness = this.state.setup.calculatedModifiers.sharpness;
        } else {
            // otherwise, always set sharpness to max possible
            if (sharpnessPlus) {
                selectedSharpness = sharpnesses[sharpnessPlus].indexOf(0) > -1 ? sharpnesses[sharpnessPlus].indexOf(0) - 1 : 5;
            } else {
                selectedSharpness = sharpnesses[0].indexOf(0) > -1 ? sharpnesses[0].indexOf(0) - 1 : 5;
            }
        }
        this.setState({
            selectedSharpness: selectedSharpness
        }, () => {
            this.calculateModifiers(); // fire calculateModifiers after setting state
        });
    }

    // method that goes through the selected modifiers and generates the calculatedModifiers object,
    // which contains the multipliers and modifiers used by calculateDamage(). calls calculateTable()
    // once the calculateModifiers state is updated
    calculateModifiers() {
        var setup = this.state.setup;
        var modData = null,
            selectedModifiers = setup.selectedModifiers,
            calculatedModifiers = {
                pAdd: 0, pMul: 0, aff: 0, vo: false, wex: false, cbo: false, ec: false,
                sharpness: this.state.selectedSharpness, lsspirit: this.state.selectedSpirit, phialc: this.state.selectedPhials,
                elem: [{eAdd: 0, eMul: 0}, {eAdd: 0, eMul: 0}, {eAdd: 0, eMul: 0}, {eAdd: 0, eMul: 0}, {eAdd: 0, eMul: 0}]
            };
        // go through selected modifiers and set pertinent multiplers and modifiers
        selectedModifiers.map(modifier => {
            modData = this.props.modifiers[modifier];
            calculatedModifiers.pAdd += modData.dAdd;
            calculatedModifiers.pMul += modData.dMul;
            calculatedModifiers.aff += modData.aff;
            if (modData.eType > 0) {
                // if eType > 0, the modifiers only pertain to a single element...
                calculatedModifiers.elem[modData.eType - 1].eAdd = modData.eAdd;
                calculatedModifiers.elem[modData.eType - 1].eMul = modData.eMul;
            } else if (modData.eType == 0) {
                // ... otherwise, it applies to every element
                calculatedModifiers.elem.map((elem, i) => {
                    calculatedModifiers.elem[i].eAdd = modData.eAdd;
                    calculatedModifiers.elem[i].eMul = modData.eMul;
                })
            }
            // set modifier flags for relevant modifiers
            if (modifier == 1) {
                // Virus Overcome active
                calculatedModifiers.vo = true;
            } else if (modifier == 4) {
                // Weakness Exploit active
                calculatedModifiers.wex = true;
            } else if (modifier == 40) {
                // Critical Boost active
                calculatedModifiers.cbo = true;
            } else if (modifier == 49) {
                // Elemental Crit active
                calculatedModifiers.ec = true;
            }
        });
        setup.calculatedModifiers = calculatedModifiers;
        this.setState({
            setup: setup,
            sharpnessPlus: (selectedModifiers.indexOf(3) > -1 || selectedModifiers.indexOf(2) > -1 ? (selectedModifiers.indexOf(2) > -1 ? 2 : 1) : 0),
            calculatedModifiers: calculatedModifiers
        }, () => {
            this.calculateTable();
        });
    }

    // method that generates a 'virtual' table of calculated damage values and stores it in tableValues.
    // also uses setMinMax() method to generate values for the range cells. calls generateCode() to
    // automatically update the hashId code for the setup
    calculateTable() {
        var weaponTypes = this.props.weaponTypes;
        var tempCalc = null,
            tableValues = {};
        weaponTypes[this.state.setup.selectedWeaponType].motions.map((motion, y) => {
            this.state.selectedMonsterData['damage' + this.state.selectedMonsterState].map((monsterWeakness, x) => {
                tempCalc = calculateDamage(
                    motion,
                    this.state.setup.selectedWeaponData,
                    weaponTypes[this.state.setup.selectedWeaponType],
                    (this.state.selectedMonsterBrokenParts.indexOf(x) > -1 ? monsterWeakness.damageBroken : monsterWeakness.damage),
                    this.state.selectedSharpness,
                    this.state.calculatedModifiers
                );
                // save value for [x, y] field
                tableValues[x + '-' + y] = tempCalc;
                // ascertain and save value for [x] row, if needed
                tableValues[x + 'x'] = (x + 'x') in tableValues ? this.setMinMax(tableValues[x + 'x'], tempCalc) : {min: tempCalc, max: tempCalc};
                // ascertain and save value for [y] column, if needed
                tableValues[y + 'y'] = (y + 'y') in tableValues ? this.setMinMax(tableValues[y + 'y'], tempCalc) : {min: tempCalc, max: tempCalc};
                // ascertain and save values for 'totals' cell, if needed
                tableValues.all = 'all' in tableValues ? this.setMinMax(tableValues.all, tempCalc) : {min: tempCalc, max: tempCalc};
            });
        });
        this.setState({tableValues: tableValues});
        this.generateCode(); // call to automatically update the hashId code for the setup
    }

    // method that compares and ascertains the min and max ranges
    //  aggregate : stored calc object generated by calculateDamage() from tableValues for x, y, or all field
    //  calc      : newly generated calc object generaetd by calculateDamage() to compare against stored aggregate
    setMinMax(aggregate, calc) {
        // compare totalDamages for min
        if (calc.totalDamage < aggregate.min.totalDamage) {
            aggregate.min = calc;
        }
        // compare totalDamages for max
        if (calc.totalDamage > aggregate.max.totalDamage) {
            aggregate.max = calc;
        }
        return aggregate;
    }

    // helper method for render() that returns the correct heatmap class for the table cell
    // after comparing to the 'all' cell values calculated by calculateTable()
    //  val : damage value to compare against 'all'
    calcHeatmapColor(val) {
        let min = this.state.tableValues.all.min.totalDamage,
            max = this.state.tableValues.all.max.totalDamage;
        let colors = ['heat1', 'heat2', 'heat3', 'heat4', 'heat5', 'heat6'],
            color = '';
        let increment = (max - min) / 7; // there are 6 heat classes + 1 no heat class
        let index = Math.floor((max - val) / increment);

        if (index < colors.length) {
            color = colors[index];
        }

        return color;
    }

    // helper method for render() that returns the display for the elemental damage(s) for the
    // table cell
    //  aggregate : boolean that denotes whether or not the aggregate view mode is set
    //  calc      : calc object generated by calculateDamage() for the cell
    showElemDmg(aggregate, calc) {
        let dmg = calc.elementalDamage,
            types = calc.elementalTypes;
        if (types.length > 0) {
            if (aggregate) {
                // display the circle icon...
                return (types.map((type, i) => { return (dmg[i] > 0 ? <span key={i} className={"element-dmg " + type.name}><i className="fa fa-circle"></i></span> : null); }));
            } else {
                // ... or the actual elemental damage
                return (types.map((type, i) => { return (dmg[i] > 0 ? <span key={i} className={"element-dmg " + type.name}>+{dmg[i]}</span> : null); }));
            }
        }
    }

    // method for generating the hashId code for the setup. calls this.props.codeUpdate() to send
    // the code back to parent class
    generateCode() {
        let settings = [],
            code = '';
        settings.push(this.state.setup.selectedWeaponType);
        settings.push(this.state.setup.selectedWeapon);
        settings = settings.concat([this.state.selectedSharpness, this.state.selectedSpirit, this.state.selectedPhials]);
        settings = settings.concat(this.state.setup.selectedModifiers);
        code = hashids.encode(settings);
        this.setState({code: code});
        this.props.codeUpdate(code, this.state.setupInfo.key);
    }

    // method for handling the sharpness dropdown selection
    handleSharpnessSelection(ref) {
        this.setState({
            selectedSharpness: parseInt(ref.target.value),
            selectedSharpnessFlag: true
        }, () => {
            this.calculateTable();
        });
    }

    // method for handling the spirit dropdown selection (for long swords)
    handleSpiritSelection(ref) {
        this.setState({selectedSpirit: parseInt(ref.target.value)}, () => {
            this.calculateModifiers();
        });
    }

    // method for handling the phial count dropdown selection (for charge blades)
    handlePhialSelection(ref) {
        this.setState({selectedPhials: parseInt(ref.target.value)}, () => {
            this.calculateModifiers();
        });
    }

    // dummy method for handling (attempted) changes to setup url input
    handleSetupUrlChange() {
        return undefined;
    }

    // method for selecting the entire content of the setup url input field for easy copying
    handleSetupUrlFocus(e) {
        e.target.select();
    }

    render() {
        var weaponTypes = this.props.weaponTypes,
            modifiers = this.props.modifiers;
        var selectedWeaponType = this.state.setup.selectedWeaponType,
            selectedWeapon = this.state.setup.selectedWeapon,
            selectedWeaponData = this.state.setup.selectedWeaponData,
            selectedMonsterData = this.state.selectedMonsterData,
            selectedMonsterState = this.state.selectedMonsterState,
            selectedModifiers = this.state.setup.selectedModifiers,
            selectedSharpness = this.state.selectedSharpness,
            selectedSpirit = this.state.selectedSpirit,
            selectedPhials = this.state.selectedPhials,
            setupInfo = this.state.setupInfo;
        var sharpnessPlus = this.state.sharpnessPlus,
            showAggregateDmg = this.state.showAggregateDmg;
        var tableValues = this.state.tableValues;
        return (
            <div className={"row" + (setupInfo.key > 0 ? " dmg-body-top-pad" : "")}>
                <div className="col-xs-12 col-sm-12">
                    <small>{weaponTypes[selectedWeaponType].name}</small> <strong>{selectedWeaponData.name}</strong> vs <strong>{selectedMonsterData.name}</strong>
                    <div className="setup-control-container">
                        <a className="btn btn-primary btn-xs" onClick={() => this.props.addSetup(null)}><i className="material-icons md-18">add</i> add setup</a>
                        <a className="btn btn-default btn-xs" onClick={setupInfo.key == setupInfo.selected ? null : this.props.activateSetup.bind(this, setupInfo.key)} disabled={setupInfo.key == setupInfo.selected ? true : false}><i className="material-icons md-18">edit</i> edit setup</a>
                        <a className="btn btn-danger btn-xs" onClick={setupInfo.count == 1 ? null : this.props.delSetup.bind(this, setupInfo.key)} disabled={setupInfo.count == 1 ? true : false}><i className="material-icons md-18">delete</i> delete setup</a>
                    </div>
                </div>
                <div className="col-xs-12 col-sm-12 small">
                    <div className="form-group form-group-inline">
                        <label className="col-xs-4 col-sm-1 text-right">Sharpness</label>
                        <div className="col-xs-5 col-sm-2">
                            <select className="form-control" value={selectedSharpness} onChange={this.handleSharpnessSelection}>
                                {
                                    selectedWeaponData.sharpnesses[sharpnessPlus].filter(sharpness => {
                                        return (sharpness > 0);
                                    }).map((sharpness, i) => {
                                        return (<option key={i} value={i}>{sharpnesses[i]}</option>);
                                    })
                                }
                            </select>
                        </div>
                    </div>

                    {selectedWeaponType == 2 ?
                        <div className="form-group form-group-inline">
                            <label className="col-xs-4 col-sm-1 text-right">Spirit</label>
                            <div className="col-xs-5 col-sm-2">
                                <select className="form-control" value={selectedSpirit} onChange={this.handleSpiritSelection}>
                                    {lsSpiritOptions.map((spirit, i) => {
                                    return (<option key={i} value={i}>{spirit}</option>);
                                })}
                                </select>
                            </div>
                        </div>
                    : null}
                    {selectedWeaponType == 10 ?
                        <div className="form-group form-group-inline">
                            <label className="col-xs-4 col-sm-1 text-right">Phials</label>
                            <div className="col-xs-5 col-sm-2">
                                <select className="form-control" value={selectedPhials} onChange={this.handlePhialSelection}>
                                    {cbPhialOptions.map(phial => {
                                    return (<option key={phial} value={phial}>{phial}</option>);
                                })}
                                </select>
                            </div>
                        </div>
                    : null}
                </div>
                <div className="col-xs-12 col-sm-12">
                    <div className="modifiers-list small">
                        {selectedModifiers && selectedModifiers.length > 0 ?
                            <div>
                                <strong>Meowdifiers: </strong>
                                {selectedModifiers.map(modifier => {
                                    return (<span className="label label-default" key={modifier}>{modifiers[modifier].name}</span>)
                                })}
                            </div>
                        : <div><strong>No Meowdifiers Applied</strong></div>}
                    </div>
                </div>
                {tableValues ?
                    <table className="table table-condensed table-bordered dmg-table">
                        <thead>
                            <tr>
                                <th className="no-border"></th>
                                <th className="no-border"></th>
                                {selectedMonsterData['damage' + selectedMonsterState].map((monsterWeakness, x) => {
                                    return (<th key={x} className="dmg-td">{monsterWeakness.name}{"damageBroken" in monsterWeakness ? <div className="checkbox broken"><label>Broken <input type="checkbox" checked={this.state.selectedMonsterBrokenParts.indexOf(x) > -1 ? true: false} onChange={() => this.props.handleMonsterPartBreakToggle(x)} /></label></div> : ""}</th>);
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="no-border"></td>
                                {showAggregateDmg
                                    ? <td className="dmg-td all-range"><span className="dmg">{tableValues.all.min.totalDamage}</span>{this.showElemDmg(showAggregateDmg, tableValues.all.min)} ~ <span className="dmg">{tableValues.all.max.totalDamage}</span>{this.showElemDmg(showAggregateDmg, tableValues.all.max)}</td>
                                    : <td className="dmg-td all-range"><span className="dmg">{tableValues.all.min.physicalDamage}</span>{this.showElemDmg(showAggregateDmg, tableValues.all.min)} ~ <span className="dmg">{tableValues.all.max.physicalDamage}</span>{this.showElemDmg(showAggregateDmg, tableValues.all.max)}</td>
                                }
                                {selectedMonsterData['damage' + selectedMonsterState].map((monsterWeakness, x) => {
                                    let dmgDisplay = showAggregateDmg
                                        ? <td key={x} className="dmg-td"><span className="dmg">{tableValues[x + "x"].min.totalDamage}</span>{this.showElemDmg(showAggregateDmg, tableValues[x + "x"].min)} ~ <span className="dmg">{tableValues[x + "x"].max.totalDamage}</span>{this.showElemDmg(showAggregateDmg, tableValues[x + "x"].max)}</td>
                                        : <td key={x} className="dmg-td"><span className="dmg">{tableValues[x + "x"].min.physicalDamage}</span>{this.showElemDmg(showAggregateDmg, tableValues[x + "x"].min)} ~ <span className="dmg">{tableValues[x + "x"].max.physicalDamage}</span>{this.showElemDmg(showAggregateDmg, tableValues[x + "x"].max)}</td>;
                                    return dmgDisplay;
                                })}
                            </tr>
                            {weaponTypes[selectedWeaponType].motions.map((motion, y) => {
                                return (
                                    <tr key={y}>
                                        <td><span className="dotted" data-toggle="tooltip" data-placement="bottom" title={"[" + motion.power + "]"}>{motion.name}</span></td>
                                        {showAggregateDmg
                                            ? <td className="dmg-td"><span className="dmg">{tableValues[y + "y"].min.totalDamage}</span>{this.showElemDmg(showAggregateDmg, tableValues[y + "y"].min)} ~ <span className="dmg">{tableValues[y + "y"].max.totalDamage}</span>{this.showElemDmg(showAggregateDmg, tableValues[y + "y"].max)}</td>
                                            : <td className="dmg-td"><span className="dmg">{tableValues[y + "y"].min.physicalDamage}</span>{this.showElemDmg(showAggregateDmg, tableValues[y + "y"].min)} ~ <span className="dmg">{tableValues[y + "y"].max.physicalDamage}</span>{this.showElemDmg(showAggregateDmg, tableValues[y + "y"].max)}</td>
                                        }
                                        {selectedMonsterData['damage' + selectedMonsterState].map((monsterWeakness, x) => {
                                            let dmgDisplay = showAggregateDmg
                                                ? <td key={x} className={"dmg-td " + this.calcHeatmapColor(tableValues[x + "-" + y].totalDamage)}><span className="dmg">{tableValues[x + "-" + y].totalDamage}</span>{this.showElemDmg(showAggregateDmg, tableValues[x + "-" + y])}</td>
                                                : <td key={x} className={"dmg-td " + this.calcHeatmapColor(tableValues[x + "-" + y].totalDamage)}><span className="dmg">{tableValues[x + "-" + y].physicalDamage}</span>{this.showElemDmg(showAggregateDmg, tableValues[x + "-" + y])}</td>;
                                            return dmgDisplay;
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                : null}
                <div className="setup-url">
                    <div className="col-xs-12 col-sm-2 text-right"><i className="fa fa-link"></i> link to above setup:</div>
                    <div className="col-xs-12 col-sm-10"><input id={"setup-" + this.state.setupInfo.key} onChange={this.handleSetupUrlChange} onFocus={this.handleSetupUrlFocus} value={urlQueryEdit(window.location.href, 's', this.state.code)} /></div>
                </div>
            </div>
        );
    }
};

// where the magic happens; holdover from the original calculating palico.
// this function is called [num of moves for weapon] * [num hitzones for monster]
function calculateDamage(motion, weapon, weaponType, damage, sharpness, modifiers) {
    // return blank if any of the parameters are undefined
    if (typeof motion === 'undefined' || typeof weapon === 'undefined' || typeof weaponType === 'undefined' || typeof damage === 'undefined' || typeof modifiers === 'undefined') {
        return '';
    }
    // special handling for weapon.affinity
    weapon.affinity = isNaN(weapon.affinity) || weapon.affinity === '' ? 0 : parseInt(weapon.affinity);

    // raw power calculation function
    var pPwr = function(attack, affinity, sharpness, modmul, modadd, critboost) {
        // limit affinity to max 100%
        if (affinity > 100) { affinity = 100; }
        // set critical multiplier
        critamt = 0.25
        if (critboost) { critamt = 0.4; }
        return ((attack + modadd) * (1 + critamt * (affinity/100))) * sharpness * (1 + modmul);
    }
    // raw elemental power calculation function
    var ePwr = function(attack, affinity, ecmod, sharpness) {
        // limit affinity to max 100%; mainly for elemental crit calculations
        if (affinity > 100) { affinity = 100; }
        return attack * (1 + ecmod * (affinity/100)) * sharpness;
    }
    // true power calculation function
    var pDmg = function(pwr, motionPower, res) {
        // modify resistance as needed if Weakness Exploit skill is active
        if (modifiers.wex === true && res > 44) { res += 5; }
        return Math.floor(pwr * (motionPower / 100) * (res / 100));
    }
    // true elemental power calculation function
    var eDmg = function(pwr, res, modmul, modadd, emod) {
        // limit elemental damage modifier to max 1.2x
        if (modmul > 0.2) { modmul = 0.2; }
        return Math.floor((pwr * (1 + modmul) + (modadd / 10)) * (res / 100) * emod);
    }

    // special considerations: long swords
    var pMul = modifiers.pMul;
    if (weaponType.id == 2) {
        switch (modifiers.lsspirit) {
            case 1:
                pMul += 0.05;
                break;
            case 2:
                pMul += 0.1;
                break;
            case 3:
                pMul += 0.2;
                break;
        }
    }

    // special considerations: charge blades
    var cb_Exp = function(attackName, attack, modmul, modadd, res, phialc, phialt) {
        if (phialt == 'Impact') {
            var modlo = 0.05;
            var modhi = 0.1;
        }
        else if (phialt == 'Element') {
            var modlo = 2.5;
            var modhi = 3.5;
        }
        if (attackName == 'Sword: Return Stroke' || attackName == 'Shield Attack' || attackName == 'Axe: Element Discharge 1' || attackName == 'Axe: Element Discharge 1 (Boost Mode)' || attackName == 'Axe: Dash Element Discharge 1' || attackName == 'Axe: Dash Element Discharge 1 (Boost Mode)') {
            return cb_ExpEq(attack, modmul, modadd, res, modlo, 1, 1);
        }
        else if (attackName == 'Axe: Element Discharge 2' || attackName == 'Axe: Element Discharge 2 (Boost Mode)') {
            return cb_ExpEq(attack, modmul, modadd, res, modlo, 2, 1);
        }
        else if (attackName == 'Axe: Amped Element Discharge' || attackName == 'Axe: Amped Element Discharge (Boost Mode)') {
            return cb_ExpEq(attack, modmul, modadd, res, modhi, 3, 1);
        }
        else if (attackName == 'Axe: Super Amped Element Discharge') {
            return cb_ExpEq(attack, modmul, modadd, res, modhi, 3, phialc);
        }
        else {
            return 0;
        }
    };

    var cb_ExpEq = function(attack, modmul, modadd, res, phialMulti, expCount, phialCount) {
        return Math.floor(Math.floor((attack + (modadd / 10)) * (1 + modmul) * (res / 100)) * phialMulti) * expCount * phialCount;
    };

    var affinityBase = 0
    // modify affinity based on frenzy virus modifiers (and frenzy virus weapons)
    if (weapon.affinity_virus != null) {
        if (modifiers.vo === true) affinityBase = Math.abs(weapon.affinity) + weapon.affinity_virus;
        else affinityBase = weapon.affinity + weapon.affinity_virus;
    }
    else {
        if (modifiers.vo === true) affinityBase = weapon.affinity + 15;
        else affinityBase = weapon.affinity;
    }

    var sharpnessMod = [0.5, 0.75, 1.0, 1.05, 1.2, 1.32, 1.45];
    var sharpnessModE = [0.25, 0.5, 0.75, 1.0, 1.0625, 1.125, 1.2];

    var pwr = pPwr(weapon.attack, affinityBase + modifiers.aff, sharpnessMod[sharpness], pMul, modifiers.pAdd, modifiers.cbo);
    // special considerations: switch axes
    if (weaponType.id == 9) {
        var pwrSACharge = pPwr(weapon.attack, affinityBase + modifiers.aff, sharpnessMod[sharpness], pMul + 0.2, modifiers.pAdd, modifiers.cbo);
    }
    var epwrs = [];
    var etype = [];
    var ecmod = 0;

    // set Elemental Crit (weapon-type dependent)
    if (modifiers.ec === true) {
        switch (weaponType.id) {
            case 1:
                ecmod = 0.2;
                break;
            case 3:
                ecmod = 0.35;
                break;
            case 4:
                ecmod = 0.35;
                break;
            default:
                ecmod = 0.25;
        }
    }

    weapon.elements.map(element => {
        epwrs.push(ePwr(element.attack, affinityBase + modifiers.aff, ecmod, sharpnessModE[sharpness]));
        etype.push(element);
    });

    var raw = [];
    var rawE = [];
    epwrs.map((epwr, i) => {
        rawE[i] = 0;
    });
    for (var i = 0; i < motion.power.length; i++) {
        var rawPower = pwr;

        // switch axe charge damage
        if (weaponType.id == 9 && weapon.phial == 'Power' && motion.name.indexOf('Sword:') > -1) {
            rawPower = pwrSACharge;
        }

        // raw damage
        raw.push(pDmg(rawPower, motion.power[i], damage[motion.type[i]]));

        // charge blade phial damage
        if (weaponType.id == 10 && weapon.phial == 'Impact') {
            raw.push(cb_Exp(motion.name, weapon.attack, 0, 0, 100, modifiers.phialc, weapon.phial));
        }

        if (epwrs.length > 0) {
            var elementIndex = 0;
            var emod = 1;
            if (!(typeof motion.emod === 'undefined')) {
                // grab elemental damage modifier from json
                emod = motion.emod[i];
                if (weaponType.id == 9 && weapon.phial != 'Element') {
                    // if switch axe phial type is not elemental, do not apply elemental modifier
                    emod = 1;
                }
            }
            if (!(typeof motion.element === 'undefined') && epwrs.length > 1) {
                // Mainly for dual swords; Use the index of the element based on the motion data.
                elementIndex = motion.element[i];
            }

            var elementType = etype[elementIndex].id - 1;

            if(elementType >= modifiers.elem.length) {
                // element Type is one of the various status effects, skip it.
                continue;
            }

            rawE[elementIndex] += eDmg(epwrs[elementIndex], damage[3 + elementType],
                modifiers.elem[elementType].eMul, modifiers.elem[elementType].eAdd, emod);

            // charge blade elemental phial damage
            if (weaponType.id == 10 && weapon.phial == 'Element' && weapon.elements[0].id != 0) {
                rawE[elementIndex] += cb_Exp(motion.name, weapon.elements[0].attack, 10, modifiers.elem[elementType].eMul,
                    modifiers.elem[elementType].eAdd, damage[3 + elementType], modifiers.phialc, weapon.phial);
            }
        }
    }
    var sum = raw.reduce(function(a, b) { return a + b; })
    var totalDamage = sum;
    if(rawE.length > 0) {
        totalDamage += rawE.reduce(function(a, b) { return a + b; });
    }

    return ({
        'physicalDamage': sum,
        'elementalDamage': rawE,
        'elementalTypes': etype,
        'totalDamage': totalDamage,
    });
}

// global function to generate the home url for the page. basically it returns the current url with
// no query/search values
//  href : current url
function urlHome(href) {
    let tempHref = href && url.parse(href, false);
    delete tempHref.search;
    return url.format(tempHref);
}

// global function to update the query values in the url using the nodejs url lib
//  href  : current url
//  key   : query key to set/edit/delete
//  value : value to set for query key
function urlQueryEdit(href, key, value) {
    let tempHref = href && url.parse(href, true);
    delete tempHref.search;
    if (value && value != '') {
        tempHref.query[key] = value;
    } else {
        delete tempHref.query[key]
    }
    return url.format(tempHref);
}

// global function to scroll the browser view to the top of page
function scrollToTop() {
    $(window.opera ? 'html' : 'html, body').animate({
        scrollTop: 0
    }, 400);
}

// render calculating palico x
ReactDOM.render(
    <CalculatingPalicoX />,
    document.getElementById("container")
);
