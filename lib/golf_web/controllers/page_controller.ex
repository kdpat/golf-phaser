defmodule GolfWeb.PageController do
  use GolfWeb, :controller

  def home(conn, _params) do
    render(conn, :home, page_title: "Home", token: get_csrf_token())
  end

  def join_lobby(conn, %{"id" => id}) do
    id = id |> String.trim() |> String.downcase()

    case Golf.Lobbies.get_lobby(id) do
      nil ->
        conn
        |> put_flash(:error, "Game #{id} not found.")
        |> redirect(to: ~p"/")

      lobby ->
        unless Golf.GamesDb.game_exists?(id) do
          user = conn.assigns.user
          {:ok, lobby} = Golf.Lobbies.add_lobby_user(lobby, user)
          Golf.broadcast!("lobby:#{id}", {:user_joined, lobby, user})
          redirect(conn, to: ~p"/lobby/#{id}")
        else
          conn
          |> put_flash(:error, "Game #{id} already started.")
          |> redirect(to: ~p"/")
        end
    end
  end
end
