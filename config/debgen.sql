-- phpMyAdmin SQL Dump
-- version 4.5.4.1deb2ubuntu2
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Erstellungszeit: 24. Jun 2017 um 19:26
-- Server-Version: 10.0.29-MariaDB-0ubuntu0.16.04.1
-- PHP-Version: 7.0.18-0ubuntu0.16.04.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Datenbank: `debgen`
--

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `deb_release`
--

CREATE TABLE `deb_release` (
  `release_id` int(15) NOT NULL,
  `release_code` varchar(255) NOT NULL,
  `release_name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `lastchanges`
--

CREATE TABLE `lastchanges` (
  `lc_id` int(11) NOT NULL,
  `lc_date` date NOT NULL,
  `lc_text` tinytext NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `repos`
--

CREATE TABLE `repos` (
  `repo_id` int(15) NOT NULL,
  `repo_name` varchar(255) NOT NULL,
  `repo_desc` text NOT NULL,
  `repo_url` text NOT NULL,
  `repo_url_src` text NOT NULL,
  `repo_gpg` text NOT NULL,
  `repo_arch` text NOT NULL,
  `repo_homepage` text NOT NULL,
  `repo_documentation` text NOT NULL,
  `repo_release` int(15) NOT NULL,
  `repo_checked` int(15) NOT NULL,
  `issue` tinyint(1) NOT NULL,
  `issue_key` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `users`
--

CREATE TABLE `users` (
  `uid` int(15) NOT NULL,
  `username` varchar(250) NOT NULL,
  `password` varchar(250) NOT NULL,
  `email` varchar(250) NOT NULL,
  `notify` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `deb_release`
--
ALTER TABLE `deb_release`
  ADD PRIMARY KEY (`release_id`);

--
-- Indizes für die Tabelle `lastchanges`
--
ALTER TABLE `lastchanges`
  ADD PRIMARY KEY (`lc_id`);

--
-- Indizes für die Tabelle `repos`
--
ALTER TABLE `repos`
  ADD PRIMARY KEY (`repo_id`);

--
-- Indizes für die Tabelle `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`uid`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `deb_release`
--
ALTER TABLE `deb_release`
  MODIFY `release_id` int(15) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
--
-- AUTO_INCREMENT für Tabelle `lastchanges`
--
ALTER TABLE `lastchanges`
  MODIFY `lc_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=89;
--
-- AUTO_INCREMENT für Tabelle `repos`
--
ALTER TABLE `repos`
  MODIFY `repo_id` int(15) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=139;
--
-- AUTO_INCREMENT für Tabelle `users`
--
ALTER TABLE `users`
  MODIFY `uid` int(15) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
