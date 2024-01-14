defmodule Golf.GamesDbTest do
  use Golf.DataCase

  alias Golf.{Games, GamesDb}
  alias Golf.Games.Event

  describe "games" do
    import Golf.UsersFixtures

    test "two player game" do
      user0 = user_fixture()
      game = GamesDb.create_game(user0)

      user1 = user_fixture(%{name: "bob"})
      {:ok, game} = GamesDb.add_player(game, user1)

      found_game = GamesDb.get_game(game.id)
      assert game == found_game

      {:ok, game} = GamesDb.create_round(game)

      found_game = GamesDb.get_game(game.id)
      assert game == found_game

      [p0, p1] = game.players
      assert Games.can_act?(game, p0)
      assert Games.can_act?(game, p1)

      event = Event.new(p0.id, :flip, 0)
      {:ok, game} = GamesDb.handle_event(game, event)

      event = Event.new(p1.id, :discard, 0)
      assert_raise FunctionClauseError, fn -> GamesDb.handle_event(game, event) end

      event = Event.new(p1.id, :flip, 5)
      {:ok, game} = GamesDb.handle_event(game, event)

      found_game = GamesDb.get_game(game.id)
      assert game == found_game

      event = Event.new(p1.id, :flip, 4)
      {:ok, game} = GamesDb.handle_event(game, event)
      # Games.playable_cards(game, p1)
      # |> dbg()
    end
  end
end

    # import Golf.GamesFixtures

    # @invalid_attrs %{}

    # test "list_games/0 returns all games" do
    #   host = user_fixture()
    #   game = game_fixture(%{host_id: host.id})
    #   assert GamesDb.list_games() == [game]
    # end

    # # test "get_game!/1 returns the game with given id" do
    # #   host = user_fixture()
    # #   game = game_fixture(%{host_id: host.id})
    # #   assert Games.get_game!(game.id) == game
    # # end

    # test "create_game/1 with valid data creates a game" do
    #   user = user_fixture()
    #   valid_attrs = %{host_id: user.id}
    #   assert {:ok, %Game{} = _game} = GamesDb.insert_game(valid_attrs)
    # end

    # test "create_game/1 with invalid data returns error changeset" do
    #   assert {:error, %Ecto.Changeset{}} = GamesDb.insert_game(@invalid_attrs)
    # end

    # # test "update_game/2 with valid data updates the game" do
    # #   game = game_fixture()
    # #   update_attrs = %{state: :uncover}

    # #   assert {:ok, %Game{} = game} = Games.update_game(game, update_attrs)
    # # end

    # # # test "update_game/2 with invalid data returns error changeset" do
    # # #   game = game_fixture()
    # # #   assert {:error, %Ecto.Changeset{}} = Games.update_game(game, @invalid_attrs)
    # # #   assert game == Games.get_game!(game.id)
    # # # end

    # test "delete_game/1 deletes the game" do
    #   host = user_fixture()
    #   game = game_fixture(%{host_id: host.id})
    #   assert {:ok, %Game{}} = GamesDb.delete_game(game)
    #   #assert_raise Ecto.NoResultsError, fn -> Games.get_game(game.id) end
    # end

    # test "change_game/1 returns a game changeset" do
    #   host = user_fixture()
    #   game = game_fixture(%{host_id: host.id})
    #   assert %Ecto.Changeset{} = GamesDb.change_game(game)
    # end
