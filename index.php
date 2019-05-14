<?php

	require_once('config/config.php');
	require_once('libs/main_server.php');
	
	$repo = new Repo($db);
	$release = $repo->getRelease();
	
	$changes = new Changes($db);
	$allchangesDate = $changes->getChangesDate();
	
	require_once("tpl/header.php");
	
	if(isset($_POST['mail']) AND isset($_POST['subject']) AND isset($_POST['message']))
	{
		$repo->feedback($_POST['mail'], $_POST['subject'], $_POST['message']);
		echo "<script>alert('Thanks for your feedback/help!');</script>";
	}
	
	if(isset($_GET["generate"]))
	{
		require_once("tpl/generate.php");
	}
	elseif(isset($_GET["changes"]))
	{
		require_once("tpl/changes.php");
	}
	elseif(isset($_GET["feedback"]))
	{
		require_once("tpl/feedback.php");
	}
	else
	{
		require_once("tpl/start.php");
	}

	require_once("tpl/footer.php");
?>
