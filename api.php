<?php

if(isset($_GET['get_repos']))
{
    require_once 'config/config.php';

    $repo = new Repo($db);

    $repoAll = $repo->getRepos();
    $repoOut2 = array();

    foreach ($repoAll as $repoOut) {
		if($repoOut['repo_release'] == $_GET['release_id'])
		{
            $temT = array('repo_id' => $repoOut['repo_id'], 'repo_name' => $repoOut['repo_name'], 'repo_desc' => $repoOut['repo_desc'], 'repo_url' => $repoOut['repo_url'],'repo_url_src' => $repoOut['repo_url_src'],'repo_gpg' => $repoOut['repo_gpg'],'repo_arch' => $repoOut['repo_arch'],'repo_homepage' => $repoOut['repo_homepage'],'repo_documentation' => $repoOut['repo_documentation'], 'repo_cat' => $repoOut['repo_cat']);
            array_push($repoOut2, $temT);
		}
    }
    header('Content-Type: application/javascript');
    echo json_encode($repoOut2);	

 
}

if(isset($_GET['brokenRepo']))
{
    require_once 'config/config.php';

    $repo = new Repo($db);

    $repoAll = $repo->setRepoBroken($_POST['id'], $_POST['key']);	
 
}

?>
