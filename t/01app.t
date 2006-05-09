use Test::More tests => 2;
use_ok( Catalyst::Test, 'PlaggerLDR' );

ok( request('/')->is_success );
