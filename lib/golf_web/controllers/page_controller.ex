defmodule GolfWeb.PageController do
  use GolfWeb, :controller

  def home(conn, _params) do
    render(conn, :home, page_title: "Home", token: get_csrf_token())
  end

  def create_game(conn, _params) do
    game = Golf.GamesDb.create_game(conn.assigns.user)
    redirect(conn, to: ~p"/game/#{game.id}")
  end
end
