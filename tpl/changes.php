
<?php

	foreach($allchangesDate as $coutDate)
	{
		echo '<h4 class="header">'.date('M d, Y', strtotime($coutDate['lc_date'])).'</h4>';
		$allchanges = $changes->getChanges($coutDate['lc_date']);
		
		foreach($allchanges as $cout)
		{
			echo '<li>'.$cout['lc_text'].'</li>';
		}
	}
?>

