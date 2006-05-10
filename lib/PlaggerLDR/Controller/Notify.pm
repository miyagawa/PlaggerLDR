package PlaggerLDR::Controller::Notify;

use strict;
use warnings;
use base 'Catalyst::Controller';

# XXX anti-DRY
use YAML;
use List::Util qw(first);
use Plagger::Schema::SQLite;

my $config = YAML::LoadFile( PlaggerLDR->path_to('root', 'config.yaml') );
my $module = first { $_->{module} eq 'Store::DBIC' } @{$config->{plugins}};
my $schema = Plagger::Schema::SQLite->connect(@{$module->{config}->{connect_info}});

sub notify : Global {
    my($self, $c) = @_;
    my $unread = $schema->resultset('Entry')->search({ read => 0 })->count;
    $c->response->content_type('text/plain');
    $c->response->body("|$unread|http://reader.livedoor.com/reader/\n");
}

1;
