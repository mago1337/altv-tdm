import * as alt from 'alt';
import * as extended from 'server-extended'; //https://github.com/team-stuyk-alt-v/altV-Extended
import * as chat from 'chat'; //https://github.com/team-stuyk-alt-v/altV-Chat-Extended
import { skinList } from './skins.mjs';
import { skinBallas } from './skins.mjs';
import { skinVagos } from './skins.mjs';
import { skinLSPD } from './skins.mjs';
import { weaponList } from './weapons.mjs';
import * as utility from './utility.mjs';

const spawnBallas = { x: 176.43, y: -1736.61, z: 29.27 };
const spawnVagos = { x: 61.33, y: -1567, z: 29.44 };
const spawnLSPD = { x: 359.14, y: -1582, z: 29.27 };

const markerVagos = { x: 68.79, y: -1569.78, z: 29.58 };

var playerVehicle;

var playerKills = 0;

var playerHasVehicle = false;
var playerTeam;

const spawnLocation = {x: 104.75, y: -1943.61, z: 20.78};
var disconnectedPlayers = new Map();

export function playerFirstJoin(player) {

	extended.SetupExportsForPlayer(player);

	/* Prevent reconnections to the server to some degree.
	if (disconnectedPlayers.get(player.name)) {
		disconnectedPlayers.set(player.name, Date.now() + 120000);
		chat.send(player, '{FF0000} You recently disconnected. Please close your game and rejoin.');
		setTimeout(() => {
			player.kick();
		}, 15000);
		return;
	}*/
	alt.emit('broadcastMessage', `{FFF000}${player.name}{FFFFFF} entrou no servidor.`);
	utility.loadModelForPlayers(player);

	SpawnPlayer(player); 
}

export function playerDisconnect(player) {
	// Remove from dimension if they're in one.
	if (player.currentDimension)
		player.currentDimension.Remove(player);

	// Disconnect the player for 25 seconds.
	disconnectedPlayers.set(player.name, Date.now() + 120000);

	if (playerHasVehicle == true) {
		try {
			playerVehicle.destroy();
			playerHasVehicle = false;
		} catch (err) { alt.log(`Erro (disconnect): ${ err }`)}
    }
}

export function checkDisconnects() {
	disconnectedPlayers.forEach((time, name) => {
		if (Date.now() < time)
			return;

		disconnectedPlayers.delete(name);
		console.log(`===> ${name} is free to rejoin.`);
	});
}

function addPlayerPoint(player) {
	playerKills = playerKills + 1;
	chat.send(player, `Você agora possui ${playerKills} kills.`)
}

// Handle player death & point system
	
export function onPlayerDeath(victim, killer, weapon) {

	alt.emitClient(victim, 'notifications:show', 'Você morreu e retornará ao spawn de sua facção.', false, 6);
	alt.emitClient(null, 'notifications:showWithPicture', `${killer} te matou`, `Arma: ${weaponList[weapon]}`, 'A vingança nunca é plena, mata a alma e evenena!', 'CHAR_CALL911', 1, false, -1, 3);
	console.log(JSON.stringify(victim));
	console.log(JSON.stringify(killer));
	if (victim != killer) {
		addPlayerPoint(killer);
	}
}

// Handle player respawn
export function respawnPlayer(target) {
    
	const skin = target.model;
    
	target.dimension = 0;
	
	setTimeout(() => {
		if (playerTeam = 'Ballas') {
			target.spawn(spawnBallas.x, spawnBallas.y, spawnBallas.z);
		}
		else if (playerTeam = 'Vagos') {
			target.spawn(extended.RandomPosAround(spawnVagos, 5));
		}
		else if (playerTeam = 'LSPD') {
			target.spawn(extended.RandomPosAround(spawnLSPD, 5));
			target.armor = 200;
		}
		target.health = 200;
	}, 4000);
}

function spawnPlayerVehicle(player, arg) {

	const positionNear = extended.RandomPosAround(player.pos, 1);

	if (playerHasVehicle == true) {
		try {
			playerVehicle.destroy();
			playerVehicle = new alt.Vehicle(arg, positionNear.x, positionNear.y, positionNear.z, 0, 0, 0);
			playerHasVehicle = true;
			playerVehicle.dimension = player.dimension;
			alt.emitClient(player, 'warpIntoVehicle', playerVehicle);
		} catch (err) { alt.log(`Erro (PHV = true): ${err}`); }
	}
	else if (playerHasVehicle == false) {
		try {
			playerVehicle = new alt.Vehicle(arg, positionNear.x, positionNear.y, positionNear.z, 0, 0, 0);
			playerHasVehicle = true;
			playerVehicle.dimension = player.dimension;
			alt.emitClient(player, 'warpIntoVehicle', playerVehicle);
		} catch (err) { alt.log(`Erro (PHV = FALSE): ${err}`); }
	}
}

export function setPlayerTeam(player, sel) {
	playerTeam = sel;

	if (sel == 'Ballas'){
		const randomBallas = Math.floor(Math.random() * skinBallas.length);
		player.model = alt.hash(skinBallas[randomBallas]);
		utility.loadModelForPlayers(player);
		player.giveWeapon(weaponList['pistol'], 48, false);
		player.pos = extended.RandomPosAround(spawnBallas, 5);
		player.dimension = 0;
		setTimeout(() => {
			spawnPlayerVehicle(player, 'faction');
			chat.send(player, `Você recebeu um veículo modelo {FFF000}Faction{FFFFFF} por ter se juntado à ${sel}.`);
		}, 1000);
	}
	else if (sel == 'Vagos'){
		const randomVagos = Math.floor(Math.random() * skinVagos.length);
		player.model = alt.hash(skinVagos[randomVagos]);
		utility.loadModelForPlayers(player);
		player.giveWeapon(weaponList['pistol'], 48, false);
		player.pos = extended.RandomPosAround(spawnVagos, 5);
		player.dimension = 0;
		setTimeout(() => {
			spawnPlayerVehicle(player, 'tornado');
			chat.send(player, `Você recebeu um veículo modelo {FFF000}Tornado{FFFFFF} por ter se juntado à ${sel}.`);
		}, 1000);
	}

	else if (sel == 'LSPD'){
		const randomLSPD = Math.floor(Math.random() * skinLSPD.length);
		player.model = alt.hash(skinLSPD[randomLSPD]);
		utility.loadModelForPlayers(player);
		player.giveWeapon(weaponList['pistolmk2'], 48, false);
		player.giveWeapon(weaponList['pumpshotgun'], 48, false);
		player.pos = extended.RandomPosAround(spawnLSPD, 5);
		player.dimension = 0;
		setTimeout(() => {
			spawnPlayerVehicle(player, 'police3');
			chat.send(player, `Você recebeu um veículo modelo {FFF000}Police Cruiser{FFFFFF} por ter se juntado à ${sel}.`);
		}, 1000);
	}	
}

function SpawnPlayer(player) {
	const randomPosition = extended.RandomPosAround(spawnLocation, 5);
	const randomModel = Math.floor(Math.random() * skinList.length);
	player.model = 'mp_m_freemode_01';
	player.dimension = 1;
    
	// Wait to set player health.
	setTimeout(() => {
		player.pos = randomPosition;
		player.health = 200;
	}, 1000);
    
	alt.emitClient(null, 'notifications:showWithPicture', 'Bem-vindo ao Blaine TDM', 'Por: Element & LucasMorais', 'Aperte F2 para selecionar a sua equipe e começar a jogar!', 'CHAR_BLANK_ENTRY', 1, false, -1, 13);
	
	// Setup for extended / chat
	chat.setupPlayer(player);
	extended.SetupExportsForPlayer(player);
}