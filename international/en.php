<?php

// The first term here is the name that will appear in the drop-down list
// This has the form $langname['file_name without .php extension'] = "Display Name";
// Try to name your file as the two-letter language code so RompR can pick a suitable
// default language automatically.

$langname['en'] = "English";

$languages['en'] = array (

	// The Sources Chooser Button tooltips
	"button_local_music" => "Music Collection",
	"button_file_browser" => "File Browser",
	"button_internet_radio" => "Internet Radio Stations and Podcasts",
	"button_albumart" => "Album Art Manager",

	// Tooltips for Buttons across the top of the information panel
	"button_togglesources" => "Toggle Sources Panel",
	"button_back" => "Back",
	"button_history" => "History",
	"button_forward" => "Forward",
	"button_toggleplaylist" => "Toggle Playlist",

	// Tooltips for playlist buttons
	"button_alarm" => "Alarm Clock",
	"button_prefs" => "RompR Preferences",
	"button_clearplaylist" => "Clear Playlist",
	"button_loadplaylist" => "Load Saved Playlist",
	"button_saveplaylist" => "Save Playlist",

	// Tooltips for playback controls
	"button_previous" => "Previous Track",
	"button_play" => "Play/Pause",
	"button_stop" => "Stop",
	"button_stopafter" => "Stop After Current Track",
	"button_next" => "Next Track",
	"button_love" => "Love this track",
	"button_ban" => "Ban this track",
	"button_volume" => "Drag to change volume",
	"button_closewindow" => "Close Window",

	// Titles for drop-down menus
	"menu_history" => "HISTORY",
	"menu_config" => "CONFIGURATION",
	"menu_clearplaylist" => "CLEAR PLAYLIST",
	"menu_saveplaylist" => "SAVE PLAYLIST AS",
	"menu_playlists" => "PLAYLISTS",

	// Configuration menu entries
	"config_language" => "LANGUAGE",
	"config_theme" => "THEME",
	"config_hidealbumlist" => "Hide Music Collection",
	"config_keepsearch" => "...but Keep Search Box Visible",
	"config_hidefileslist" => "Hide Files List",
	"config_hidelastfm" => "Hide Last.FM Stations",
	"config_hideradio" => "Hide Radio Stations",
	"config_hidebrowser" => "Hide Info Panel",
	"config_fullbio" => "Retrieve full artist biographies from Last.FM",
	"config_lastfmlang" => "Language for Last.FM and Wikipedia",
	"config_lastfmdefault" => "Default language (English)",
	"config_lastfminterface" => "RompR's interface language",
	"config_lastfmbrowser" => "Browser's default language",
	"config_lastfmlanguser" => "This specific language:",
	"config_langinfo" => "Last.FM and Wikipedia will fall back to English if information can't be found in your language",
	"config_autoscroll" => "Auto-Scroll playlist to current track",
	"config_autocovers" => "Automatically Download Covers",
	"config_musicfolders" => "To use art from your music folders or get lyrics from your files, enter the path to your music in this box:",
	"config_crossfade" => "Crossfade Duration (seconds)",
	"config_clicklabel" => "Music Selection Click Behaviour",
	"config_doubleclick" => "Double-click to add, Click to select",
	"config_singleclick" => "Click to add, no selection",
	"config_sortbydate" => "Sort Albums By Date",
	"config_notvabydate" => "Don't Apply Date Sorting to 'Various Artists'",
	"config_dateinfo" => "You must update your music collection after changing date settings",
	"config_updateonstart" => "Update Music Collection On Start",
	"config_updatenow" => "Update Music Collection Now",
	"config_rescan" => "Full Local Music Rescan",
	"config_editshortcuts" => "Edit Keyboard Shortcuts...",
	"config_audiooutputs" => "Audio Outputs",
	"config_lastfmusername" => "Last.FM Username",
	"config_loginbutton" => "Login",
	"config_scrobbling" => "Last.FM Scrobbling Enabled",
	"config_scrobblepercent" => "Percentage of track to play before scrobbling",
	"config_autocorrect" => "Last.FM Autocorrect Enabled",
	"config_tagloved" => "Tag Loved Tracks With:",
	"config_fontsize" => "FONT SIZE",
	"config_fontname" => "FONT STYLE",
	"config_alarm_on" => "Alarm Clock Enabled",

	// Various buttons for the playlist dropdowns
	"button_imsure" => "I'm Sure About This",
	"button_save" => "Save",

	// General Labels and buttons in the main layout
	"label_lastfm" => "Last.FM",
	"button_searchmusic" => "Search Music",
	"button_searchfiles" => "Search Files",
	"label_yourradio" => "Your Radio Stations",
	"label_podcasts" => "Podcasts",
	"label_somafm" => "Soma FM",
	"label_icecast" => "Icecast Radio",
	"label_emptyinfo" => "This is the information panel. Interesting stuff will appear here when you play some music",
	"button_playlistcontrols" => "Playlist Controls",
	"button_shuffle" => "SHUFFLE",
	"button_crossfade" => "CROSSFADE",
	"button_repeat" => "REPEAT",
	"button_consume" => "CONSUME",
	"label_yes" => "Yes",
	"label_no" => "No",
	"mopidy_down" => "The connection to Mopidy has been lost!",
	"label_updating" => "Updating Music Collection",
	"label_update_error" => "Failed to generate music collection!",
	"label_notsupported" => "Operation not supported!",
	"label_playlisterror" => "Something went wrong retrieving the playlist!",
	"label_mpd_no" => "MPD cannot adjust volume while playback is stopped",
	"label_downloading" => "Downloading...",
	"button_OK" => "OK",
	"button_cancel" => "Cancel",
	"error_playlistname" => "Playlist name cannot contain slashes",
	"label_savedpl" => "Playlist saved as %s",
	"label_loadingstations" => "Loading Stations...",

	// Search Forms
	"label_searchfor" => "Search For",
	"label_searching" => "Searching...",
	"button_search" => "Search",
	"label_searchresults" => "Search Results",
	"label_multiterms" => "Multiple search terms can be used at once",
	"label_limitsearch" => "Search Specific Backends",
	"label_filesearch" => "Search For Files Containing",

	// General multipurpose labels
	"label_tracks" => "tracks",
	"label_albums" => "albums",
	"label_artists" => "artists",
	"label_track" => "Track",
	"label_album" => "Album",
	"label_artist" => "Artist",
	"label_anything" => "Anything",
	"label_genre" => "Genre",
	"label_composer" => "Composer",
	"label_performer" => "Performer",
	"label_rating" => "Rating",
	"label_tag" => "Tag",
	"label_discogs" => "Discogs",
	"label_musicbrainz" => "Musicbrainz",
	"label_wikipedia" => "Wikipedia",
	"label_general_error" => "There was an error. Please refresh the page and try again",
	"label_days" => "days",
	"label_hours" => "hours",
	"label_minutes" => "minutes",
	"label_noalbums" => "No Individual Albums Returned By Search",
	"label_notracks" => "No Individual Tracks Returned By Search",
	"label_duration" => "Duration",
	"label_playererror" => "Player Error",
	"label_internet_radio" => "Internet Radio",
	"label_tunefailed" => "Failed To Tune Radio Station",
	"label_noneighbours" => "Did not find any neighbours",
	"label_nofreinds" => "You have 0 freinds",
	"label_notags" => "Did not find any tags",
	"label_noartists" => "Did not find any top artists",
	"mopidy_tooold" => "Your version of Mopidy is too old. Please update to version %s or later",
	"button_playradio" => "Play",

	// Playlist and Now Playing
	"label_waitingforstation" => "Waiting for station info...",
	"label_notforradio" => "Not supported for radio streams",
	"label_incoming" => "Incoming...",
	"label_addingtracks" => "Adding Tracks",
	// Now Playing - [track name] by [artist] on [album]
	"label_by" => "by",
	"label_on" => "on",
	// Now playing - 1:45 of 6:50
	"label_of" => "of",

	// Podcasts
	"podcast_rss_error" => "Failed to download RSS feed",
	"podcast_remove_error" => "Failed to delete podcast",
	"podcast_general_error" => "Operation failed :(",
	"podcast_entrybox" => "Enter a URL of a podcast RSS feed in this box, or drag its icon there",
	// Podcast tooltips
	"podcast_delete" => "Delete this Podcast",
	"podcast_configure" => "Configure this Podcast",
	"podcast_refresh" => "Refresh this Podcast",
	"podcast_download_all" => "Download All Episodes of this Podcast",
	"podcast_mark_all" => "Mark All Episodes as Listened",
	// Podcast display options
	"podcast_display" => "Display",
	"podcast_display_all" => "Everything",
	"podcast_display_onlynew" => "Only New",
	"podcast_display_unlistened" => "New and Unlistened",
	"podcast_display_downloadnew" => "New and Downloaded",
	"podcast_display_downloaded" => "Only Downloaded",
	// Podcast refresh options
	"podcast_refresh" => "Refresh",
	"podcast_refresh_never" => "Manually",
	"podcast_refresh_hourly" => "Hourly",
	"podcast_refresh_daily" => "Daily",
	"podcast_refresh_weekly" => "Weekly",
	"podcast_refresh_monthly" => "Monthly",
	// Podcast auto expire
	"podcast_expire" => "Keep Episodes For",
	"podcast_expire_tooltip" => "Any episodes older than this value will be removed from the list. Changes to this option will take effect next time you refresh the podcast",
	"podcast_expire_never" => "Ever",
	"podcast_expire_week" => "One Week",
	"podcast_expire_2week" => "Two Weeks",
	"podcast_expire_month" => "One Month",
	"podcast_expire_2month" => "Two Months",
	"podcast_expire_6month" => "Six Months",
	"podcast_expire_year" => "One Year",
	// Podcast number to keep
	"podcast_keep" => "Number To Keep",
	"podcast_keep_tooltip" => "The list will only ever show this many episodes. Changes to this option will take effect next time you refresh the podcast",
	"podcast_keep_0" => "Unlimited",
	// Podcast other options
	"podcast_keep_downloaded" => "Keep all downloaded episodes",
	"podcast_kd_tooltip" => "Enable this option to keep all downloaded episodes. The above two options will then only apply to episodes that have not been downloaded",
	"podcast_auto_download" => "Automatically Download New Episodes",
	"podcast_tooltip_new" => "This is a new episode",
	"podcast_tooltip_notnew" => "This episode is not new but it has not been listened to",
	"podcast_tooltip_downloaded" => "This episode has been downloaded",
	"podcast_tooltip_download" => "Download this episode to your computer",
	"podcast_tooltip_mark" => "Mark as listened",
	"podcast_tooltip_delepisode" => "Delete this episode",
	"podcast_expired" => "This episode has expired",
	// eg 2 days left to listen
	"podcast_timeleft" => "%s left to listen",

	// Soma FM Chooser Panel
	"label_soma" => "Soma.FM is a listener supported commercial-free radio station from San Francisco",
	"label_soma_beg" => "Please consider supporting Soma.FM if you like these stations",

	// Your radio stations
	"label_radioinput" => "Enter a URL of an internet station in this box, or drag its Play button there",

	//Album Art Manager
	"albumart_title" => "Album Art",
	"albumart_getmissing" => "Get Missing Covers",
	"albumart_showall" => "Show All Covers",
	"albumart_instructions" => "Click a cover to change it, or drag an image from your hard drive or another browser window",
	"albumart_onlyempty" => "Show Only Albums Without Covers",
	"albumart_allartists" => "All Artists",
	"albumart_unused" => "Unused Images",
	"albumart_deleting" => "Deleting...",
	"albumart_error" => "That didn't work",
	"albumart_googlesearch" => "Google Search",
	"albumart_local" => "Local Images",
	"albumart_upload" => "File Upload",
	"albumart_uploadbutton" => "Upload",
	"albumart_newtab" => "Google Search in New Tab",
	"albumart_dragdrop" => "You can drag-and-drop images from your hard drive or another browser window directly onto the image (in most browsers)",
	"albumart_showmore" => "Show More Results",
	"albumart_googleproblem" => "There was a problem. Google said",
	"albumart_getthese" => "Get These Covers",
	"albumart_deletethese" => "Delete These Covers",
	"albumart_nocollection" => "Please create your music collection before trying to download covers",
	"albumart_nocovercount" => "albums without a cover",
	"albumart_getting" => "Getting",

	// Setup page (rompr/?setup)
	"setup_connectfail" => "Rompr could not connect to an mpd or mopidy server",
	"setup_connecterror" => "There was an error when communicating with your mpd or mopidy server : ",
	"setup_request" => "You requested the setup page",
	"setup_addressnote" => "Note: localhost in this context means the computer running the apache server",
	"setup_port" => "Port",
	"setup_advanced" => "Advanced options",
	"setup_leaveblank" => "Leave these blank unless you know you need them",
	"setup_password" => "Password",
	"setup_unixsocket" => "UNIX-domain socket",
	"setup_mopidy" => "Mopidy-specific Settings",
	"setup_mopidyport" => "Mopidy HTTP port:",
	"setup_debug" => "Enable Debug Logging",

	// Intro Window
	"intro_title" => "Information About This Version",
	"intro_welcome" => "Welcome to RompR version",
	"intro_viewingmobile" => "You are viewing the mobile version of RompR. To view the standard version go to",
	"intro_viewmobile" => "To view the mobile version go to",
	"intro_basicmanual" => "The Basic RompR Manual is at:",
	"intro_forum" => "The Discussion Forum is at:",
	"intro_mopidy" => "IMPORTANT Information for Mopidy Users",
	"intro_mopidywiki" => "If you are running Mopidy, please read the Wiki",
	"intro_mopidyversion" => "You must be using Mopidy %s or later",

	// Last.FM
	"lastfm_loginwindow" => "Log In to Last.FM",
	"lastfm_login1" => "Please click the button below to open the Last.FM website in a new tab. Enter your Last.FM login details if required then give RompR permission to access your account",
	"lastfm_login2" => "You can close the new tab when you have finished but do not close this dialog!",
	"lastfm_loginbutton" => "Click Here To Log In",
	"lastfm_login3" => "Once you have logged in to Last.FM, click the OK button below to complete the process",
	"lastfm_loginfailed" => "Failed to log in to Last.FM",
	"label_loved" => "Loved",
	"label_lovefailed" => "Failed To Make Love",
	"label_unloved" => "Unloved",
	"label_unlovefailed" => "Failed To Remove Love",
	"label_banned" => "Banned",
	"label_banfailed" => "Failed To Ban",
	"label_scrobbled" => "Scrobbled",
	"label_scrobblefailed" => "Failed to scrobble",

	// Info Panel
	"info_gettinginfo" => "Getting Info...",
	"info_clicktoshow" => "CLICK TO SHOW",
	"info_clicktohide" => "CLICK TO HIDE",
	"info_newtab" => "View In New Tab",

	// File Info panel
	"button_fileinfo" => "Info Panel (File Information)",
	"info_file" => "File:",
	"info_from_beets" => "(from beets server)",
	"info_format" => "Format:",
	"info_bitrate" => "Bitrate:",
	"info_samplerate" => "Sample Rate:",
	"info_mono" => "Mono",
	"info_stereo" => "Stereo",
	"info_channels" => "Channels",
	"info_date" => "Date:",
	"info_genre" => "Genre:",
	"info_performers" => "Performers:",
	"info_composers" => "Composers:",
	"info_comment" => "Comment:",
	"info_label" => "Label:",
	"info_disctitle" => "Disc Title:",
	"info_encoder" => "Encoder:",
	"info_year" => "Year:",

	// Last.FM Info Panel
	"button_infolastfm" => "Info Panel (Last.FM)",
	"label_notrackinfo" => "Could not find information about this track",
	"label_noalbuminfo" => "Could not find information about this album",
	"label_noartistinfo" => "Could not find information about this artist",
	"lastfm_listeners" => "Listeners:",
	"lastfm_plays" => "Plays:",
	"lastfm_yourplays" => "Your Plays:",
	"lastfm_toptags" => "TOP TAGS:",
	"lastfm_readfullbio" => "Read Full Biography",
	"lastfm_addtags" => "ADD TAGS",
	"lastfm_addtagslabel" => "Add tags, comma separated",
	"button_add" => "ADD",
	"lastfm_yourtags" => "YOUR TAGS:",
	"lastfm_buyoncd" => "BUY ON CD:",
	"lastfm_download" => "DOWNLOAD:",
	"lastfm_simar" => "Similar Artists",
	"lastfm_removetag" => "Remove Tag",
	"lastfm_buyalbum" => "BUY THIS ALBUM",
	"lastfm_releasedate" => "Release Date",
	"lastfm_viewtrack" => "View track on Last.FM",
	"lastfm_buytrack" => "BUY THIS TRACK",
	"lastfm_tagerror" => "Failed to modify tags",
	"lastfm_loved" => "Loved",
	"lastfm_lovethis" => "Love This Track",
	"lastfm_unlove" => "Unlove This Track",
	"lastfm_notfound" => "%s Not Found",
	"lastfm_nobio" => "No full biography available",

	// Lyrics info panel
	"button_lyrics" => "Info Panel (Lyrics)",
	"lyrics_lyrics" => "Lyrics",
	"lyrics_nonefound" => "No Lyrics were found",
	"lyrics_info" => "To use the lyrics viewer you need to ensure your local files are tagged with lyrics",
	"lyrics_nopath" => "To use the lyrics viewer you need to ensure your local files are tagged with lyrics and set the music path in the preferences",

	// For Discogs/Musicbrainz release tables. LABEL in this context means record label
	// These are all section headers and so should all be UPPER CASE, unless there's a good linguistic
	// reason not to do that
	"title_year" => "YEAR",
	"title_title" => "TITLE",
	"title_artist" => "ARTIST",
	"title_type" => "TYPE",
	"title_label" => "LABEL",
	"label_pages" => "PAGES",

	// For discogs/musicbrains album info. discogs_companies means the companies involved in producing the album
	// These are all section headers and so should all be UPPER CASE, unless there's a good linguistic
	// reason not to do that
	"discogs_companies" => "COMPANIES",
	"discogs_personnel" => "PERSONNEL",
	"discogs_videos" => "VIDEOS",
	"discogs_styles" => "STYLES",
	"discogs_genres" => "GENRES",
	"discogs_tracklisting" => "TRACK LISTING",
	"discogs_realname" => "REAL NAME:",
	"discogs_aliases" => "ALIASES:",
	"discogs_alsoknown" => "ALSO KNOWN AS:",
	"discogs_external" => "EXTERNAL LINKS",
	"discogs_bandmembers" => "BAND MEMBERS",
	"discogs_memberof" => "MEMBER OF",
	"discogs_discography" => "%s DISCOGRAPHY",

	// Discogs info panel
	"button_discogs" => "Info Panel (Discogs)",
	"discogs_error" => "There was a network error or Discogs refused to reply",
	"discogs_nonsense" => "Couldn't get a sensible response from Discogs",
	"discogs_noalbum" => "Couldn't find this album on Discogs",
	"discogs_notrack" => "Couldn't find this track on Discogs",
	"discogs_slideshow" => "Slideshow",

	// Musicbrainz info panel
	"button_musicbrainz" => "Info Panel (Musicbrainz)",
	"musicbrainz_error" => "Did not get a response from MusicBrainz",
	"musicbrainz_contacterror" => "There was an error contacting Musicbrainz",
	"musicbrainz_noartist" => "Could not find this artist on Musicbrainz",
	"musicbrainz_noalbum" => "Could not find this album on Musicbrainz",
	"musicbrainz_notrack" => "Could not find this track on Musicbrainz",
	"musicbrainz_noinfo" => "Could not get information from Musicbrainz",
	// This is used for date ranges -  eg 2005 - Present
	"musicbrainz_now" => "Present",
	"musicbrainz_origin" => "ORIGIN",
	"musicbrainz_active" => "ACTIVE",
	"musicbrainz_rating" => "RATING",
	"musicbrainz_notes" => "NOTES",
	"musicbrainz_tags" => "TAGS",
	"musicbrainz_externaldiscography" => "Discography (%s)",
	"musicbrainz_officalhomepage" => "Official Homepage (%s)",
	"musicbrainz_fansite" => "Fan Site (%s)",
	"musicbrainz_lyrics" => "Lyrics (%s)",
	"musicbrainz_social" => "Social Network",
	"musicbrainz_microblog" => "Microblog",
	"musicbrainz_review" => "Review (%s)",
	"musicbrainz_novotes" => "(No Votes)",
	// eg: 3/5 from 15 votes
	"musicbrainz_votes" => "%s/5 from %s votes",
	"musicbrainz_appears" => "THIS TRACK APPEARS ON",
	"musicbrainz_credits" => "CREDITS",
	"musicbrainz_status" => "STATUS",
	"musicbrainz_date" => "DATE",
	"musicbrainz_country" => "COUNTRY",
	"musicbrainz_disc" => "DISC",

	// SoundCloud info panel
	"button_soundcloud" => "Info Panel (SoundCloud)",
	"soundcloud_trackinfo" => "Track Info",
	"soundcloud_plays" => "Plays",
	"soundcloud_downloads" => "Downloads",
	"soundcloud_faves" => "Faves",
	// State means eg State: Finished or State: Unfinished
	"soundcloud_state" => "State",
	"soundcloud_license" => "License",
	"soundcloud_buy" => "Buy Track",
	"soundcloud_view" => "View on SoundCloud",
	"soundcloud_user" => "SoundCloud User",
	"soundcloud_fullname" => "Full Name",
	"soundcloud_Country" => "Country",
	"soundcloud_city" => "City",
	"soundcloud_website" => "Visit Website",
	"soundcloud_not" => "This panel will only display information about music from SoundCloud",

	// Wikipedia Info Panel
	"button_wikipedia" => "Info Panel (Wikipedia)",
	"wiki_nothing" => "Got nothing from Wikipedia",
	"wiki_fail" => "Wikipedia could not find anything related to '%s'",
	"wiki_suggest" => "Wikipedia was unable to find any pages matching '%s'",
	"wiki_suggest2" => "Here are some suggestions it came up with",

	// Keybindings editor
	"title_keybindings" => "Keyboard Shortcuts",
	"button_volup" => "Volume Up",
	"button_voldown" => "Volume Down",

	// Extras for mobile version
	"button_playlist" => "Playlist",
	"button_playman" => "Playlist Management",
	"button_mob_history" => "Info Panel History",
	"config_2columns" => "Use 2 Columns in landscape mode",
	"label_streamradio" => "Local and National Radio",

	// Various Plugins, Rating, and Tagging
	"lastfm_import" => "Import Your Last.FM Library",
	"lastfm_pleaselogin" => "You must be logged in to Last.FM to do this",
	"label_nosql" => "This is not possible with your configuration",
	"label_onlyloved" => "Loved Tracks Only",
	"label_onlytagged" => "Tagged Tracks Only",
	"label_tagandlove" => "Tagged Tracks and Loved Tracks",
	"label_everything" => "Everything",
	"label_giveloved" => "Loved Tracks Get:",
	"stars" => "stars",
	"star" => "star",
	"norating" => "No Rating",
	"button_importnow" => "Import Now",
	"label_review" => "Review Results Before Importing",
	"label_addtowish" => "If A Track Can't Be Found, Add It To The Wishlist",
	"label_tags" => "Tags",
	"label_oneresult" => "Search Result",
	"label_progress" => "Progress",
	"label_wishlist" => "Wishlist",
	"label_viewwishlist" => "View Your Wishlist",
	"label_addtow" => "Added To Wishlist",
	"label_finished" => "Finished",
	"config_tagrat" => "Ratings and Tags",
	"config_synctags" => "Keep Tags in Sync With Last.FM",
	"config_loveis" => "Last.FM Love Means",
	"playlist_xstar" => "%s or More Stars",
	"playlist_5star" => "5 Star Tracks",
	"button_about" => "About Rompr",
	"label_notfound" => "Track Not Found",
	// Eg + 3 more
	"label_moreresults" => "+ %s more",
	"label_tagmanager" => "Tag Manager",
	"label_ratingmanager" => "Rating Manager",
	"label_tagmanagertop" => "Drag and Drop from the Music Collection to add tags to tracks",
	"label_ratingmanagertop" => "Drag and Drop from the Music Collection to add ratings to tracks",
	"button_createtag" => "CREATE TAG",

	//New in 0.52
	"config_alarm_ramp" => "Fade In",
	"config_ignore_unplayable" => "Ignore Unplayable Tracks",
	"label_retrieve" => "Retrieve",

	// New in 0.53
	"spotify_error" => "No response from Spotify",
	"spotify_noinfo" => "Could not get information from Spotify",
	"button_infospotify" => "Info Panel (Spotify)",
	"config_icontheme" => "ICONS",
	"label_mostplayed" => "Most Played Tracks",
	"label_radio" => "Radio",
	"label_pop" => "Popularity",
	"label_albumsby" => "Albums By This Artist",
	"label_related" => "Related Artists",
	"label_artistradio" => "Artist Radio",
	"label_mostplayed" => "Most Played Tracks",
	"label_neverplayed" => "Never Played Tracks",
	"label_radio_fartist" => "Favourite Artist Radio",
	"label_pluginplaylists" => "Personalised Radio",
	"label_recentlyadded_random" => "Recently Added Tracks (Random)",
	"label_recentlyadded_byalbum" => "Recently Added Tracks (By Album)",
	"setup_mpd" => "MPD-specific Settings",
	"settings_appearance" => "Appearance",
	"settings_panels" => "Panels",
	"settings_language" => "Language",
	"settings_interface" => "Interface",
	"label_charts" => "Your Top 40",
	"label_choosedomains" => "Search these sources:",
	"config_onthefly" => "Update Collection In The Background (for backends that support it)",
	"button_subscribe" => "Subscribe",
	"config_sortbycomposer" => "Sort Artists using Composer",
	"config_composergenre" => " .. only if Genre is:",
	"config_displaycomposer" => ".. Display Composer/Performer Info instead of Artist",

	//CHANGED in 0.53
	"config_country" => "COUNTRY (for Last.FM and Spotify)",
	"setup_labeladdresses" => "If you are having connection issues, try using an IP address instead of 'localhost'",
	"setup_ipaddress" => "Mopidy or mpd server",
	"config_dateinfo" => "You must update your music collection after changing collection settings",

);

?>