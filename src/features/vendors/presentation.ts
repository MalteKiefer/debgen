import type { WarningKey } from './model'

const warningMessages: Readonly<Record<string, string>> = {
  'docker-firewall': 'Docker kann Firewall-Regeln verändern und dadurch Firewall-Regeln umgehen.',
  'proton-vpn-supported-environment': 'Offiziell unterstützt werden nur die aktuelle stabile Debian-Version mit GNOME und kein Headless-Betrieb.',
  'tor-not-browser': 'Dieses Repository liefert Tor-Daemon und -Client, nicht den Tor Browser.',
  'nvidia-container-toolkit-prerequisites': 'Erfordert eine unterstützte NVIDIA-GPU, einen installierten NVIDIA-Treiber und eine unterstützte Container-Laufzeit.',
  'mariadb-no-setup-script': 'Die offizielle MariaDB-Einrichtung per Setup-Skript wird nicht ausgeführt; nur das geprüfte Repository wird verwendet.',
  'clickhouse-generic-debian': 'Das ClickHouse-Repository ist distributionsunabhängig; die Kompatibilität bezieht sich auf die bereitgestellten Paketarchitekturen.',
}

export function presentWarning(key: WarningKey): string { return warningMessages[key] ?? key }
