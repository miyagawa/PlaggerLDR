
use Test::More tests => 3;
use_ok( Catalyst::Test, 'PlaggerLDR' );
use_ok('PlaggerLDR::Controller::API');

ok( request('api')->is_success );

