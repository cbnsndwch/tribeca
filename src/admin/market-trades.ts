/// <reference path="../common/models.ts" />
/// <reference path="../common/messaging.ts" />
/// <reference path="shared_directives.ts"/>

import angular = require("angular");
import Models = require("../common/models");
import io = require("socket.io-client");
import moment = require("moment");
import Messaging = require("../common/messaging");
import Shared = require("./shared_directives");

class MarketTradeViewModel {
    price: number;
    size: number;
    time: moment.Moment;

    qA: number;
    qB: number;
    qAz: number;
    qBz: number;

    mA: number;
    mB: number;
    mAz: number;
    mBz: number;

    make_side: string;

    constructor(trade: Models.MarketTrade) {
        this.price = trade.price;
        this.size = trade.size;
        this.time = (moment.isMoment(trade.time) ? trade.time : moment(trade.time));

        if (trade.quote != null) {
            if (trade.quote.ask !== null) {
                this.qA = trade.quote.ask.price;
                this.qAz = trade.quote.ask.size;
            }

            if (trade.quote.bid !== null) {
                this.qB = trade.quote.bid.price;
                this.qBz = trade.quote.bid.size;
            }
        }

        if (trade.ask != null) {
            this.mA = trade.ask.price;
            this.mAz = trade.ask.size;
        }

        if (trade.bid != null) {
            this.mB = trade.bid.price;
            this.mBz = trade.bid.size;
        }

        this.make_side = Models.Side[trade.make_side];
    }
}

interface MarketTradeScope extends ng.IScope {
    marketTrades: MarketTradeViewModel[];
    marketTradeOptions: Object;
}

var MarketTradeGrid = ($scope: MarketTradeScope,
                       $log: ng.ILogService,
                       subscriberFactory: Shared.SubscriberFactory,
                       uiGridConstants: any) => {
    $scope.marketTrades = [];
    $scope.marketTradeOptions = {
        data: 'marketTrades',
        showGroupPanel: false,
        rowHeight: 20,
        headerRowHeight: 20,
        groupsCollapsedByDefault: true,
        enableColumnResize: true,
        sortInfo: { fields: ['time'], directions: ['desc'] },
        columnDefs: [
            { width: 80, field: 'time', displayName: 'Time', cellFilter: "momentShortDate", sortingAlgorithm: Shared.fastDiff, sort: { direction: uiGridConstants.DESC, priority: 1} },
            { width: 50, field: 'price', displayName: 'Price' },
            { width: 65, field: 'size', displayName: 'Size' },
            { width: 45, field: 'make_side', displayName: 'Side' },
			{ width: 65, field: 'qBz', displayName: 'Q BidSz' },
            { width: 55, field: 'qB', displayName: 'Q Bid' },
            { width: 55, field: 'qA', displayName: 'Q Ask' },
            { width: 65, field: 'qAz', displayName: 'Q AskSz' },
            { width: 65, field: 'mBz', displayName: 'T BidSz' },
            { width: 50, field: 'mB', displayName: 'T Bid' },
            { width: 50, field: 'mA', displayName: 'T Ask' },
            { width: 70, field: 'mAz', displayName: 'T AskSz' }
        ]
    };

    var addNewMarketTrade = (u: Models.MarketTrade) => {
        if (u != null)
            $scope.marketTrades.push(new MarketTradeViewModel(u));
    };

    var sub = subscriberFactory.getSubscriber($scope, Messaging.Topics.MarketTrade)
        .registerSubscriber(addNewMarketTrade, x => x.forEach(addNewMarketTrade))
        .registerConnectHandler(() => $scope.marketTrades.length = 0);

    $scope.$on('$destroy', () => {
        sub.disconnect();
        $log.info("destroy market trade grid");
    });

    $log.info("started market trade grid");
};

export var marketTradeDirective = "marketTradeDirective";

angular
    .module(marketTradeDirective, ['ui.bootstrap', 'ui.grid', Shared.sharedDirectives])
    .directive("marketTradeGrid", () => {
        var template = '<div><div style="height: 553px" class="table table-striped table-hover table-condensed" ui-grid="marketTradeOptions"></div></div>';

        return {
            restrict: 'E',
            replace: true,
            transclude: false,
            template: template,
            controller: MarketTradeGrid
        }
    });