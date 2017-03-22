<h3 class="header">New Repo / Feedback</h3>
Please use this form only if you want to report a new repo or want to share a feedback for this service with us. To report an existing repo as defective, please use the link below the repo, this also applies to errors with the keys. Thank you.

You can create a issue too: <!-- Place this tag where you want the button to render. -->
<a class="github-button" href="https://github.com/beli3ver/debgen/issues" data-count-api="/repos/beli3ver/debgen#open_issues_count" data-count-aria-label="# issues on GitHub" aria-label="Issue beli3ver/debgen on GitHub">Issue</a>

<form action="index.php" method="post" class="feedback" name="feedback">
	<p><label>Your E-Mail<br>
	<input type="email" name="mail" placeholder="Mail" required size="65" id="mail"/>
	</label></p>

	<p><label>Subject<br>
	<input type="text" name="subject" placeholder="Subject" required size="65" id="subject"/>
	</label></p>
	
	<p><label>Message<br>
	<textarea name="message" placeholder="Message" rows="10" id="message"></textarea>

	</label></p>
	<p><button class="button">Send!</button></p>
	<script>
		$(".button").click(function(){
		
			if($("#mail").val() == '' || $("#subject").val() == '' || $("#message").val() == '')
			{
				alert("Please fill up all fields!");
			}
			else
			{
				$('form').submit();
			}
			
		});
	</script>
</form>
