package PlaggerLDR::Controller::API;

use strict;
use warnings;
use base 'Catalyst::Controller';

use YAML;
use List::Util qw(first);
use Plagger::Schema::SQLite;

my $config = YAML::LoadFile( PlaggerLDR->path_to('root', 'config.yaml') );
my $module = first { $_->{module} eq 'Store::DBIC' } @{$config->{plugins}};
my $schema = Plagger::Schema::SQLite->connect(@{$module->{config}->{connect_info}});

sub default : Private {
    my($self, $c) = @_;
}

sub subs : Local {
    my($self, $c) = @_;

    my @subs;
    for my $feed ( $schema->resultset('Feed')->search({ }) ) {
        my $unread = $feed->entries({ read => 0 })->count;
        next if $c->req->param('unread') && $unread == 0;

        push @subs, {
            icon => "http://image.reader.livedoor.com/img/icon/default.gif", # TODO
            subscribe_id => $feed->id,
            unread_count => $unread,
            folder => eval { ($feed->tags)[0]->name } || '',
            tags => [], # TODO
            rate => 0,
            modified_on => ($feed->updated ? $feed->updated->epoch : time),
            title => $feed->title,
            subscribers_count => 1,
        };
    }

    $c->stash->{json} = \@subs;
}

sub unread : Local {
    my($self, $c) = @_;

    my $data;
    my @entries;

    my $feed = $schema->resultset('Feed')->find($c->req->param('subscribe_id'));

    $data->{subscribe_id} = $feed->id;
    $data->{channel} = {
        link => $feed->link,
        error_count => 0,
        description => $feed->description,
        image => $feed->image,
        title => $feed->title,
        subscribers_count => 1,
        feedlink => $feed->url,
        expires => time + 300,
    };

    my @terms = $c->stash->{is_all}
        ? (undef, { order_by => 'date DESC',
                    rows => 20,
                    page => $c->req->param('offset') / 20 + 1 })
        : ({ read => 0 });

    my @items;
    for my $entry ( $feed->entries(@terms) ) {
        push @items, {
            link => $entry->link,
            enclosure => undef,
            enclosure_type => undef,
            author => $entry->author,
            body => $entry->body,
            modified_on => ($entry->date ? $entry->date->epoch : time),
            created_on => ($entry->date ? $entry->date->epoch : time),
            category => eval { ($entry->tags)[0]->name } || undef,
            title => $entry->title,
            id => $entry->id,
        };
    }
    $data->{items} = \@items;

    $c->stash->{json} = $data;
}

sub all : Local {
    my($self, $c) = @_;
    $c->stash->{is_all} = 1;
    $c->forward('unread');
}

sub touch_all : Local {
    my($self, $c) = @_;

    my $feed = $schema->resultset('Feed')->find( $c->req->param('subscribe_id') );
    for my $entry ($feed->entries({ read => 0 })) {
        $entry->read(1);
        $entry->update;
    }

    $c->stash->{json} = { ErrorCode => 0, isSuccess => 1 };
}

sub end : Private {
    my($self, $c) = @_;
    $c->forward('View::JSON');
}

1;
