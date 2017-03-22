<h4 class="header">Sources List</h4>
<textarea autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" name="list" rows="10" cols="100">
<?php
	echo "#------------------------------------------------------------------------------#
#                   OFFICIAL DEBIAN REPOS                    
#------------------------------------------------------------------------------#

###### Debian Main Repos";
echo "\n";
  if(isset($_POST['debFast']))
    echo "deb http://deb.debian.org ". $_POST["release"]." main";
  else
	  echo "deb http://".$_POST["country"]." ".$_POST["release"]." main";

	if(isset($_POST["contrib"])) echo " contrib";
	if(isset($_POST["non-free"])) echo " non-free";
	if(isset($_POST["src"]))
	{
		echo "\n";
  if(isset($_POST['debFast']))
    echo "deb-src http://deb.debian.org ". $_POST["release"]." main";
  else
	  echo "deb-src http://".$_POST["country"]." ".$_POST["release"]." main";

		if(isset($_POST["contrib"])) echo " contrib";
		if(isset($_POST["non-free"])) echo " non-free";		
	}
	if(isset($_POST["updates"]))
	{	
		echo "\n";
		echo "\n";
  if(isset($_POST['debFast']))
    echo "deb http://deb.debian.org ". $_POST["release"]."-updates main";
  else
	  echo "deb http://".$_POST["country"]." ".$_POST["release"]."-updates main";
		if(isset($_POST["contrib"])) echo " contrib";
		if(isset($_POST["non-free"])) echo " non-free";
		if(isset($_POST["src"]))
		{
			echo "\n";
  if(isset($_POST['debFast']))
    echo "deb-src http://deb.debian.org ". $_POST["release"]."-updates main";
  else
	  echo "deb-src http://".$_POST["country"]." ".$_POST["release"]."-updates main";
			if(isset($_POST["contrib"])) echo " contrib";
			if(isset($_POST["non-free"])) echo " non-free";		
		}
	}
	if(isset($_POST["security"]))
	{	
		echo "\n";
		echo "\n";
  if(isset($_POST['debFast']))
    echo "deb http://deb.debian.org/debian-secruity ". $_POST["release"]."/updates main";
  else
		echo "deb http://security.debian.org/ ".$_POST["release"]."/updates main";
		if(isset($_POST["src"]))
		{
			echo "\n";
  if(isset($_POST['debFast']))
    echo "deb-src http://deb.debian.org/debian-secruity ". $_POST["release"]."/updates main";
  else
			echo "deb-src http://security.debian.org/ ".$_POST["release"]."/updates main";
		}
	}
	
	if(isset($_POST["backports"]))
	{	
		
		$releaseBackports = ($_POST["release"] == "stable") ? "jessie" : "wheezy";
		
		echo "\n";
		echo "\n";
		echo "deb http://ftp.debian.org/debian ".$releaseBackports."-backports main";
		if(isset($_POST["src"]))
		{
			echo "\n";
			echo "deb-src http://ftp.debian.org/debian ".$releaseBackports."-backports main";
		}
	}
if(isset($_POST["3rdparties"]))
{
	echo "\n";
	echo "\n";	
	echo "#------------------------------------------------------------------------------#
#                      UNOFFICIAL  REPOS                       
#------------------------------------------------------------------------------#

###### 3rd Party Binary Repos";
	echo "\n";
		for($i=0;$i < count($_POST["3rdparties"]);$i++)
		{
			$newstring = "";
			$newstring2 = "";
			$rd3 = $repo->getRepo($_POST["3rdparties"][$i]);
			echo "###".$rd3->repo_name."\n";
			if($rd3->repo_arch == "all" OR $rd3->repo_arch == "")
			{
				$newstring = $rd3->repo_url;
				if($rd3->repo_url_src != '') $newstring2 = $rd3->repo_url_src;
			}
			else
			{
				$newstring=substr_replace($rd3->repo_url, "[arch=$rd3->repo_arch] ", 4, 0);
				if($rd3->repo_url_src != '') $newstring2 = substr_replace($rd3->repo_url_src, "[arch=$rd3->repo_arch] ", 8, 0);;
			}
			echo $newstring;
			if($newstring2 != ''){echo "\n"; echo $newstring2;}
			echo "\n\n";
		}
}
?>
</textarea>

<h4 class="header">GPG Keys</h4>
<textarea autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" name="list" rows="10" cols="100">
<?php
	for($i=0;$i < count($_POST["3rdparties"]);$i++)
	{
		$rd3 = $repo->getRepo($_POST["3rdparties"][$i]);
		echo $rd3->repo_gpg;
		echo "\n";
	}
?>
</textarea>

<p><button class="button">Go back!</button></p>
<script>
	$(".button").click(function(){window.location.href = ".";});
</script>

