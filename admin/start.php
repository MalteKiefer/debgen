<?php


require_once("../tpl/listHeader.php");

$repos = $release->getRepos();

foreach($repos as $repOut)
{
    include("../tpl/listBody.php");
}

require_once("../tpl/listFooter.php");
