defmodule Golf.GamesDbTest do
  use Golf.DataCase

  alias Golf.GamesDb

  describe "games" do
    # alias Golf.Games.Game

    import Golf.UsersFixtures
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

    test "two player game" do
      user0 = user_fixture()
      game = GamesDb.create_game(user0)
      # IO.inspect(game)

      user1 = user_fixture(%{name: "bob"})
      {:ok, game} = GamesDb.add_player(game, user1)
      # IO.inspect(game)

      found_game = GamesDb.get_game(game.id)
      assert game == found_game
      # IO.inspect(found_game)

      {:ok, game} = GamesDb.create_round(game)
      IO.inspect(game)

      found_game = GamesDb.get_game(game.id)
      assert game == found_game
      IO.inspect(found_game)
    end
  end
end
