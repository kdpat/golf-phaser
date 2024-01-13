defmodule Golf.GamesFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Golf.Games` context.
  """

  @doc """
  Generate a game.
  """
  def game_fixture(attrs \\ %{}) do
    {:ok, game} = Golf.GamesDb.insert_game(attrs)
    game
  end
end
