//
//  BaseView.swift
//  BinBot
//
//  Created by Sbeve on 02/08/2024.
//

import SwiftUI

struct BaseView: View {
    
    @State private var LoggedInUser = ""
    
    var body: some View {
        if (LoggedInUser.isEmpty) {
            // User not logged in, render the login page...
            LogInView(UserId: $LoggedInUser)
        } else {
            // User is logged in, render the login page...
            MainView(UserId: $LoggedInUser)
        }
    }
}

#Preview {
    BaseView()
}
