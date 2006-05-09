package PlaggerLDR;

use strict;
use warnings;

use Catalyst qw/-Debug/;

__PACKAGE__->config(
    name => 'PlaggerLDR',
    'View::JSON' => {
        expose_stash => 'json',
    },
);
__PACKAGE__->setup;

sub default : Private {
    my ( $self, $c ) = @_;

    # Hello World
    $c->response->body( $c->welcome_message );
}

1;
