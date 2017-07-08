<!doctype html>
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		<title>Sources List Generator for Debian</title>
		<meta http-equiv="content-type" content="text/html;charset=iso-8859-1">
		<meta name="author" content="Malte Kiefer">
		<meta name="Publisher" content="Malte Kiefer">
		<meta name="keywords" content="Debian, Server, Repository, Generator, Sources, Sources List, deb, deb-src, Linux, distro, distribution">
		<meta name="description" content="Sources List Generator for Debian. It features the official Debian repositories as well as other 3rd party repos.">
		<meta name="Content-Language" content="en">
		<meta name="Distribution" content="Local">
		<meta name="Rating" content="General">

		<meta name="Robots" content="INDEX,FOLLOW">
		<meta name="Revisit-after" content="31 Days">
		<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Open+Sans|Source+Code+Pro">
		<script src="js/jquery.js"></script>
    <script async defer src="https://buttons.github.io/buttons.js"></script>
		<link rel="stylesheet" href="css/ionicons.min.css">
		<link rel="stylesheet" href="css/styles.css">
	</head>
	<body>
		<script>
			function brokenRepo(id)
			{
				if(confirm("Would you like to report this repo as broken?"))
				{
					if(confirm("Is the key broken?"))
					{
						$.post( "api.php?brokenRepo", { id: id , key: "1"} );
						alert("Thank you! We will fix the problem as soon as possible!");
					}
					else
					{
						$.post( "api.php?brokenRepo", { id: id , key: "0"} );
						alert("Thank you! We will fix the problem as soon as possible!");
					}
				}
			}
		</script>
		<main>
			<div class="wrap--header">
				<div class="wrap">
					<h2 class="header">Debian Sources List Generator</h2>
					<div style="right:0;">
						<a href="." class="link">Home</a>
						|
						<a href="./?changes" class="link">Last Changes</a>
						|
						<a href="./?feedback" class="link">New Repo / Feedback</a>
						|
						<a href="https://repogen.simplylinux.ch/" class="link">RepoGen (Ubuntu)</a>
						|
						<a href="https://stats.simplylinux.ch/index.php?module=CoreHome&action=index&idSite=3&period=day&date=yesterday#/module=Dashboard&action=embeddedIndex&idSite=3&period=day&date=yesterday?idSite=3&period=day&date=yesterday&category=Dashboard_Dashboard&subcategory=1" class="link">Collected Stats</a>
            |
            <a class="github-button" href="https://github.com/beli3ver/debgen" data-count-href="/beli3ver/debgen/stargazers" data-count-api="/repos/beli3ver/debgen#stargazers_count" data-count-aria-label="# stargazers on GitHub" aria-label="Star beli3ver/debgen on GitHub">Star</a> 
					</div>
				</div>
			</div>
			<div class="wrap">
