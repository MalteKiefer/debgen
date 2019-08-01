<?php

	require_once('config/config.php');
	require_once('libs/main_server.php');
	
	$repo = new Repo($db);
	$release = $repo->getRelease();

	$changes = new Changes($db);
	$allchangesDate = $changes->getChangesDate();
	
	require_once("tpl/header.php");
	
	if(isset($_GET["generate"]))
	{
		require_once("tpl/generate.php");
	}
	elseif(isset($_GET["changes"]))
	{
		require_once("tpl/changes.php");
	}
	else
	{
		require_once("tpl/start.php");
	}

	require_once("tpl/footer.php");
?>
